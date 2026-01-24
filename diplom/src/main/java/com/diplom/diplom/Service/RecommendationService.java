package com.diplom.diplom.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.DTO.RecommendationMixRequestDTO;
import com.diplom.diplom.Entity.DTO.RecommendationResultDTO;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.BookRepository;
import com.diplom.diplom.Repository.TagRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final VectorStore vectorStore;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final UserBookRepository userBookRepository;
    private final TagRepository tagRepository;

    /*
     * =============================================================================
     * БЛОК 1: Контекстные рекомендации (MULTI-ANCHOR DIVERSITY)
     * =============================================================================
     */
    public Page<RecommendationResultDTO> getRecommendationsBasedOnHistory(int page, int size) {
        User user = getCurrentUser();

        // 1. Берем историю
        List<UserBook> potentialAnchors = buildUserAnchors(user);

        if (potentialAnchors == null || potentialAnchors.isEmpty()) {
            return Page.empty();
        }

        // 2. Выбираем НЕСКОЛЬКО случайных якорей (например, до 3-х)
        List<UserBook> modifiableAnchors = new ArrayList<>(potentialAnchors);
        Collections.shuffle(modifiableAnchors);
        // Берем первые 3 книги (или меньше, если всего книг мало)
        int anchorsCount = Math.min(3, modifiableAnchors.size());
        List<UserBook> selectedAnchors = modifiableAnchors.subList(0, anchorsCount);

        log.info("[REC][History] Using {} anchors: {}", anchorsCount,
                selectedAnchors.stream().map(ub -> ub.getBook().getTitle()).toList());

        // 3. Собираем рекомендации для КАЖДОГО якоря
        // Используем Map, чтобы исключить дубликаты (Key = BookId)
        Map<Long, ScoredCandidate> uniqueCandidates = new java.util.HashMap<>();
        // Также храним объяснение ("Похоже на X") для каждой книги
        Map<Long, String> explanations = new java.util.HashMap<>();

        // Набор ID книг, которые пользователь уже читал (для фильтрации)
        Set<Long> ownedIds = userBookRepository.findAllBookIdsByUserId(user.getId());

        for (UserBook anchorUserBook : selectedAnchors) {
            Book anchor = anchorUserBook.getBook();

            // Запрос вектора для текущего якоря
            String queryText = buildItemToItemQueryText(anchor);
            // Ищем чуть меньше кандидатов на каждый якорь, чтобы не спамить
            List<ScoredCandidate> candidates = vectorSearchCandidates(queryText, 20, 0.25, null);

            for (ScoredCandidate c : candidates) {
                // Фильтр: не своя, не прочитанная
                if (ownedIds.contains(c.bookId) || c.bookId.equals(anchor.getId())) {
                    continue;
                }

                // Добавляем или обновляем (если уже есть, можно повысить скор, но пока просто
                // оставляем макс)
                if (!uniqueCandidates.containsKey(c.bookId)
                        || uniqueCandidates.get(c.bookId).similarity < c.similarity) {
                    uniqueCandidates.put(c.bookId, c);
                    // Запоминаем, почему мы это рекомендуем
                    explanations.put(c.bookId, "Похоже на \"" + anchor.getTitle() + "\"");
                }
            }
        }

        // 4. Превращаем Map в List и сортируем
        List<ScoredCandidate> finalCandidates = new ArrayList<>(uniqueCandidates.values());

        // Опция А: Сортировка по Score (самые похожие сверху)
        finalCandidates.sort(Comparator.comparingDouble((ScoredCandidate c) -> c.similarity).reversed());

        // Опция Б: Shuffle (для максимального разнообразия, чтобы книги от разных
        // якорей перемешались)
        // Collections.shuffle(finalCandidates); // Раскомментируй, если хочешь полный
        // микс

        // 5. Пагинация и Маппинг
        int from = Math.min(page * size, finalCandidates.size());
        int to = Math.min(from + size, finalCandidates.size());
        List<ScoredCandidate> pageCandidates = finalCandidates.subList(from, to);

        // Загружаем книги из БД
        List<Long> ids = pageCandidates.stream().map(c -> c.bookId).toList();
        Map<Long, Book> booksMap = bookRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Book::getId, b -> b));

        List<RecommendationResultDTO> content = new ArrayList<>();

        for (ScoredCandidate c : pageCandidates) {
            Book b = booksMap.get(c.bookId);
            if (b == null)
                continue;

            BookReadDTO bookDto = BookReadDTO.toDTO(b);
            if (bookDto != null) {
                bookDto.setIsAdded(false);
                bookDto.setAddedAt(null);
            }

            // Берем объяснение, которое сохранили ранее
            String explanationText = explanations.getOrDefault(c.bookId, "Рекомендовано вам");

            content.add(RecommendationResultDTO.builder()
                    .book(bookDto)
                    .similarity(c.similarity)
                    .score(c.similarity)
                    .explanation(explanationText)
                    .build());
        }

        return new PageImpl<>(content, PageRequest.of(page, size), finalCandidates.size());
    }

    /*
     * =============================================================================
     * =====
     * БЛОК 2: Неожиданные находки (Serendipity)
     * =============================================================================
     * =====
     */
    public Page<RecommendationResultDTO> getSerendipityRecommendations(int page, int size) {
        User user = getCurrentUser();

        // 1. Берем вектор вкуса пользователя (на основе нескольких любимых книг)
        List<UserBook> favorites = buildUserAnchors(user);
        String queryText;
        if (favorites.isEmpty()) {
            // Если нет любимых, просто ищем "интересная книга"
            queryText = "Unusual interesting book with high rating plot twist";
        } else {
            queryText = buildNextQueryText(favorites);
        }

        // 2. ВАЖНО: Ставим низкий порог (0.0), но потом отфильтруем СЛИШКОМ похожие.
        // Нам нужны книги, которые "далеки" (distance > 0.4, то есть similarity < 0.6),
        // но не мусор.
        // В pgvector similarity = 1 - distance.
        // Мы хотим distance [0.3 ... 0.7] -> similarity [0.3 ... 0.7]

        List<ScoredCandidate> candidates = vectorSearchCandidates(queryText, 80, 0.0, null);

        Set<Long> ownedIds = userBookRepository.findAllBookIdsByUserId(user.getId());
        for (UserBook ub : favorites)
            if (ub.getBook() != null)
                ownedIds.add(ub.getBook().getId());

        List<ScoredCandidate> serendipityCandidates = candidates.stream()
                .filter(c -> !ownedIds.contains(c.bookId))
                .filter(c -> c.similarity < 0.75) // Отсекаем слишком очевидные (слишком похожие)
                .filter(c -> c.similarity > 0.25) // Отсекаем полный мусор
                .collect(Collectors.toList());

        // Перемешиваем, чтобы каждый раз было что-то новое
        Collections.shuffle(serendipityCandidates);

        return mapToResultPage(serendipityCandidates, favorites, List.of(), List.of(), page, size,
                "Неожиданная находка: попробуйте что-то новое");
    }

    /*
     * =============================================================================
     * =====
     * БЛОК 4: Микс по настроению (Interactive)
     * =============================================================================
     * =====
     */
    // DTO для фильтров можно передать прямо в аргументы, здесь развернуто для
    // наглядности
    public Page<RecommendationResultDTO> getMoodRecommendations(
            String moodText, // "Мрачное", "Веселое"
            String lengthFilter, // "SHORT" (<300), "LONG" (>500), "ANY"
            String ageFilter, // "NEW" (>2010), "CLASSIC" (<1990), "ANY"
            int page,
            int size) {

        User user = getCurrentUser();
        log.info("[REC][Mood] Query='{}', Length={}, Age={}", moodText, lengthFilter, ageFilter);

        // 1. Строим векторный запрос
        StringBuilder sb = new StringBuilder();
        sb.append("Книга с настроением: ").append(moodText).append(". ");
        // Добавляем чуть-чуть контекста пользователя, чтобы совсем не улетать
        List<UserBook> anchors = buildUserAnchors(user);
        if (!anchors.isEmpty()) {
            sb.append(" Учитывая вкус: ");
            sb.append(anchors.stream().limit(2)
                    .map(ub -> ub.getBook().getTitle())
                    .collect(Collectors.joining(", ")));
        }
        String queryText = sb.toString();

        // 2. Строим фильтр метаданных (Metadata Filter)
        // В Spring AI это делается через FilterExpressionBuilder
        FilterExpressionBuilder b = new FilterExpressionBuilder();

        // Базовый фильтр (всегда true, чтобы к нему добавлять AND)
        // Но Spring AI API чуть сложнее, поэтому собираем условия
        // Пока сделаем упрощенную логику (пост-фильтрация), так как pgvector filter
        // support зависит от версии.
        // НО правильнее передавать фильтр в vectorStore.

        // ! ВАЖНО: Сейчас сделаем пост-фильтрацию (в памяти), так как не все поля
        // (pageCount) могут быть в метаданных вектора.
        // Чтобы работала пред-фильтрация, pageCount и publishedDate должны быть
        // сохранены в metadata документа при ETL.

        List<ScoredCandidate> candidates = vectorSearchCandidates(queryText, 100, 0.3, null); // Берем с запасом

        Set<Long> ownedIds = userBookRepository.findAllBookIdsByUserId(user.getId());
        List<ScoredCandidate> filtered = new ArrayList<>();

        // Загружаем книги для проверки полей (pageCount, date)
        List<Long> candidateIds = candidates.stream().map(c -> c.bookId).toList();
        Map<Long, Book> bookMap = bookRepository.findAllById(candidateIds).stream()
                .collect(Collectors.toMap(Book::getId, bk -> bk));

        for (ScoredCandidate c : candidates) {
            if (ownedIds.contains(c.bookId))
                continue;

            Book book = bookMap.get(c.bookId);
            if (book == null)
                continue;

            // Фильтр длины
            boolean lengthMatch = true;
            if ("SHORT".equalsIgnoreCase(lengthFilter) && book.getPageCount() != null && book.getPageCount() > 350)
                lengthMatch = false;
            if ("LONG".equalsIgnoreCase(lengthFilter) && book.getPageCount() != null && book.getPageCount() < 500)
                lengthMatch = false;

            // Фильтр эпохи (New / Classic)
            boolean ageMatch = true;
            if (book.getPublishedDate() != null) {
                int year = book.getPublishedDate().getYear();
                if ("NEW".equalsIgnoreCase(ageFilter) && year < 2000)
                    ageMatch = false;
                if ("CLASSIC".equalsIgnoreCase(ageFilter) && year > 1990)
                    ageMatch = false;
            }

            if (lengthMatch && ageMatch) {
                filtered.add(c);
            }
        }

        return mapToResultPage(filtered, anchors, List.of(), List.of(), page, size,
                "Подборка под настроение: " + moodText);
    }

    /*
     * =============================================================================
     * =====
     * Старые методы (для совместимости с текущим фронтом, если нужно, или перепишем
     * контроллер)
     * =============================================================================
     * =====
     */
    // Оставляем mix (Конструктор) как есть, он хороший
    public Page<RecommendationResultDTO> mix(RecommendationMixRequestDTO req, int page, int size) {
        User user = getCurrentUser();
        List<UserBook> anchors = buildUserAnchors(user);
        List<Book> explicitAnchors = loadBooksSafe(req.getAnchorBookIds());

        String queryText = buildMixQueryText(anchors, explicitAnchors, req.getTags(), req.getAdditionalText());

        List<ScoredCandidate> candidates = vectorSearchCandidates(
                queryText,
                normalizeTopK(req.getTopK()),
                normalizeThreshold(req.getThreshold()),
                null // filter
        );

        Set<Long> ownedIds = userBookRepository.findAllBookIdsByUserId(user.getId());
        if (req.getAnchorBookIds() != null)
            ownedIds.addAll(req.getAnchorBookIds());

        List<ScoredCandidate> filtered = candidates.stream()
                .filter(c -> !ownedIds.contains(c.bookId))
                .toList();

        return mapToResultPage(filtered, anchors, explicitAnchors, req.getTags(), page, size, null);
    }

    /*
     * =============================================================================
     * =====
     * PRIVATE HELPERS
     * =============================================================================
     * =====
     */

    // Находит последнюю книгу: Читаю сейчас -> Дочитал недавно -> Добавил в
    // избранное
    private Book findLastActiveBook(User user) {
        List<UserBook> ubs = user.getUserBooks();
        if (ubs == null || ubs.isEmpty())
            return null;

        // 1. Сначала Reading
        Optional<UserBook> reading = ubs.stream()
                .filter(ub -> ub.getStatus() == Status.READING)
                .max(Comparator.comparing(UserBook::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
        if (reading.isPresent())
            return reading.get().getBook();

        // 2. Потом Finished с хорошей оценкой
        Optional<UserBook> finished = ubs.stream()
                .filter(ub -> ub.getStatus() == Status.FINISHED && (ub.getRating() == null || ub.getRating() >= 4))
                .max(Comparator.comparing(UserBook::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
        if (finished.isPresent())
            return finished.get().getBook();

        // 3. Или просто избранное
        return ubs.stream()
                .filter(ub -> Boolean.TRUE.equals(ub.getIsFavorite()))
                .max(Comparator.comparing(UserBook::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(UserBook::getBook)
                .orElse(null);
    }

    private List<UserBook> buildUserAnchors(User user) {
        List<UserBook> all = user.getUserBooks() != null ? user.getUserBooks() : List.of();
        return all.stream()
                .filter(ub -> ub.getBook() != null)
                .filter(ub -> Boolean.TRUE.equals(ub.getIsFavorite())
                        || (ub.getStatus() == Status.FINISHED && ub.getRating() != null && ub.getRating() >= 4))
                .sorted(Comparator.comparing(UserBook::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .toList();
    }

    // --- Search Logic ---
    private List<ScoredCandidate> vectorSearchCandidates(String queryText, int topK, double threshold,
            FilterExpressionBuilder filter) {
        log.info("[REC][vector] Search topK={}, th={}", topK, threshold);

        SearchRequest.Builder builder = SearchRequest.builder()
                .query(queryText)
                .topK(topK)
                .similarityThreshold(threshold);

        // Если бы мы использовали нативные фильтры (нужна поддержка в ETL)
        // if (filter != null) builder.filterExpression(filter.build());

        List<Document> docs = vectorStore.similaritySearch(builder.build());

        if (docs == null)
            return List.of();

        List<ScoredCandidate> out = new ArrayList<>();
        for (Document d : docs) {
            Object idObj = d.getMetadata().get("book_id");
            if (idObj == null)
                continue;
            try {
                Long id = Long.parseLong(idObj.toString());
                double sim = extractSimilarity(d);
                out.add(new ScoredCandidate(id, sim));
            } catch (Exception e) {
                continue;
            }
        }
        out.sort(Comparator.comparingDouble((ScoredCandidate c) -> c.similarity).reversed());
        return out;
    }

    private double extractSimilarity(Document d) {
        if (d.getMetadata().containsKey("distance")) {
            try {
                double dist = Double.parseDouble(d.getMetadata().get("distance").toString());
                return Math.max(0.0, 1.0 - dist);
            } catch (Exception e) {
            }
        }
        return 0.0;
    }

    // --- Text Builders ---
    private String buildItemToItemQueryText(Book seed) {
        return "title: " + nullSafe(seed.getTitle()) + " | author: " + nullSafe(seed.getAuthor()) +
                " | genres: " + String.join(", ", seed.getGenres()) +
                " | text: " + stripHtml(seed.getAnnotation());
    }

    private String buildMixQueryText(List<UserBook> anchors, List<Book> explicit, List<String> tags, String text) {
        StringBuilder sb = new StringBuilder("Find book. ");
        if (anchors != null && !anchors.isEmpty())
            sb.append("Like: ")
                    .append(anchors.stream().map(u -> u.getBook().getTitle()).collect(Collectors.joining(", ")))
                    .append(". ");
        if (tags != null && !tags.isEmpty())
            sb.append("Themes: ").append(String.join(", ", tags)).append(". ");
        if (text != null)
            sb.append("Details: ").append(text);
        return sb.toString();
    }

    private String buildNextQueryText(List<UserBook> anchors) {
        return "Suggest next book based on user favorites: " +
                anchors.stream().map(u -> u.getBook().getTitle()).collect(Collectors.joining(", "));
    }

    // --- Mapping ---
    private Page<RecommendationResultDTO> mapToResultPage(
            List<ScoredCandidate> candidates,
            List<UserBook> userAnchors,
            List<Book> explicitAnchors,
            List<String> tags,
            int page,
            int size,
            String forcedExplanationTitle) {

        if (candidates.isEmpty())
            return Page.empty(PageRequest.of(page, size));

        int from = Math.min(page * size, candidates.size());
        int to = Math.min(from + size, candidates.size());
        List<ScoredCandidate> pageCandidates = candidates.subList(from, to);

        List<Long> ids = pageCandidates.stream().map(c -> c.bookId).toList();
        Map<Long, Book> books = bookRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Book::getId, b -> b));

        List<Book> allAnchors = new ArrayList<>();
        if (userAnchors != null)
            allAnchors.addAll(userAnchors.stream().map(UserBook::getBook).toList());
        if (explicitAnchors != null)
            allAnchors.addAll(explicitAnchors);

        List<RecommendationResultDTO> content = new ArrayList<>();
        int rank = 0;
        for (ScoredCandidate c : pageCandidates) {
            Book b = books.get(c.bookId);
            if (b == null)
                continue;

            double displayScore = c.similarity > 0.001 ? c.similarity : (0.95 - (rank * 0.01));
            rank++;

            String explanation = (forcedExplanationTitle != null)
                    ? forcedExplanationTitle
                    : buildExplanationText(b, allAnchors, tags);

            BookReadDTO bookDto = BookReadDTO.toDTO(b);
            if (bookDto != null) {
                bookDto.setIsAdded(false);
                bookDto.setAddedAt(null);
            }

            content.add(RecommendationResultDTO.builder()
                    .book(bookDto)
                    .similarity(displayScore)
                    .score(displayScore)
                    .explanation(explanation)
                    .build());
        }
        return new PageImpl<>(content, PageRequest.of(page, size), candidates.size());
    }

    // Простая генерация объяснения для совместимости
    private String buildExplanationText(Book rec, List<Book> anchors, List<String> tags) {
        // Упрощенная логика: просто берем первый попавшийся жанр или автора
        if (anchors != null && !anchors.isEmpty()) {
            for (Book a : anchors) {
                if (a.getAuthor().equals(rec.getAuthor()))
                    return "Тот же автор: " + a.getAuthor();
            }
        }
        return "Рекомендовано вам";
    }

    // --- Misc ---
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private List<Book> loadBooksSafe(List<Long> ids) {
        if (ids == null || ids.isEmpty())
            return List.of();
        return bookRepository.findAllById(ids);
    }

    private String nullSafe(String s) {
        return s == null ? "" : s.trim();
    }

    private String stripHtml(String s) {
        return s == null ? "" : s.replaceAll("<[^>]*>", " ");
    }

    private int normalizeTopK(Integer k) {
        return k == null ? 80 : k;
    }

    private double normalizeThreshold(Double t) {
        return t == null ? 0.35 : t;
    }

    private static class ScoredCandidate {
        final Long bookId;
        final double similarity;

        ScoredCandidate(Long id, double sim) {
            this.bookId = id;
            this.similarity = sim;
        }
    }

    /*
     * =============================================================================
     * =====
     * СЦЕНАРИЙ А: Item-to-Item (Похожие на конкретную книгу)
     * =============================================================================
     * =====
     */
    public Page<RecommendationResultDTO> similarTo(Long bookId, int page, int size) {
        Book seed = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Книга не найдена: " + bookId));

        // 1. Генерируем запрос на основе одной книги
        String queryText = buildItemToItemQueryText(seed);

        // 2. Ищем (TopK=50, порог 0.45)
        List<ScoredCandidate> candidates = vectorSearchCandidates(queryText, 50, 0.2, null);

        // 3. Исключаем саму эту книгу (но НЕ исключаем прочитанные пользователем,
        // так как в блоке "Похожие" можно показывать и то, что я уже читал)
        List<ScoredCandidate> filtered = candidates.stream()
                .filter(c -> !c.bookId.equals(bookId))
                .toList();

        return mapToResultPage(filtered, List.of(), List.of(seed), List.of(), page, size,
                "Похоже на \"" + seed.getTitle() + "\"");
    }

}
