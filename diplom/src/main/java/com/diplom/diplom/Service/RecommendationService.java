package com.diplom.diplom.Service;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Repository.BookRepository;
import com.diplom.diplom.Repository.TagRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final TagRepository tagRepository;
    private final VectorStore vectorStore;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final UserBookRepository userBookRepository;

    public Page<BookReadDTO> getRecommendationsByTag(String tagName, int page, int size) {
        User currentUser = getCurrentUser();

        // 1. Находим тег пользователя
        Tag tag = tagRepository.findByNameAndUser(tagName, currentUser).orElse(null);

        if (tag == null) {
            log.warn("Тег '{}' не найдет у пользователя {}", tagName, currentUser.getUsername());
            return Page.empty(PageRequest.of(page, size));
        }

        // 2. Получаем книги с этим тегом
        // Фильтруем: берем только те, где рейтинг >= 4 или статус != 'DROPPED' (заброшено)
        List<UserBook> taggedBooks = tag.getUserBooks().stream()
                .filter(ub -> !"DROPPED".equals(ub.getStatus().name()))
                .filter(ub -> ub.getRating() == null || ub.getRating() >= 4)
                .collect(Collectors.toList());

        if (taggedBooks.isEmpty()) {
             log.info("Нет подходящих книг для формирования профиля по тегу '{}'", tagName);
             return Page.empty(PageRequest.of(page, size));
        }

        // 3. Строим "Профиль интереса" (Centroid-like Text Profile)
        // Собираем статистику по жанрам и авторам
        Map<String, Integer> genreCounts = new HashMap<>();
        Map<String, Integer> authorCounts = new HashMap<>();
        List<String> titles = new ArrayList<>();

        for (UserBook ub : taggedBooks) {
            Book b = ub.getBook();
            titles.add(b.getTitle());
            
            if (b.getAuthor() != null) {
                authorCounts.merge(b.getAuthor(), 1, Integer::sum);
            }
            if (b.getGenres() != null) {
                for (String g : b.getGenres()) {
                    genreCounts.merge(g, 1, Integer::sum);
                }
            }
        }

        List<String> topGenres = getTopKeys(genreCounts, 3);
        List<String> topAuthors = getTopKeys(authorCounts, 2);

        // Формируем "Семантический запрос"
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("Посоветуй книгу. ");
        
        if (!topGenres.isEmpty()) {
            queryBuilder.append("Жанры: ").append(String.join(", ", topGenres)).append(". ");
        }
        
        if (!topAuthors.isEmpty()) {
            queryBuilder.append("В стиле авторов: ").append(String.join(", ", topAuthors)).append(". ");
        }
        
        // Добавляем примеры книг, но не слишком много, чтобы не перегрузить контекст
        if (!titles.isEmpty()) {
            queryBuilder.append("Похожие на: ").append(String.join(", ", titles.subList(0, Math.min(titles.size(), 5)))).append(". ");
        }
        
        // Добавляем контекст самого тега, вдруг он семантически значим (напр. "Грустные книги")
        queryBuilder.append("Контекст пользователя: ").append(tagName);

        String queryText = queryBuilder.toString();
        log.info("Сгенерирован профиль для тега '{}': {}", tagName, queryText);

        // 4. Поиск векторов
        SearchRequest request = SearchRequest.builder()
                .query(queryText)
                .topK(50) 
                .similarityThreshold(0.35) 
                .build();

        List<Document> similarDocs = vectorStore.similaritySearch(request);

        // 5. Исключаем книги, которые у пользователя УЖЕ есть
        // Сначала получим найденные ID
        List<Long> candidateIds = similarDocs.stream()
                .map(doc -> {
                    Object id = doc.getMetadata().get("book_id");
                    return id != null ? Long.parseLong(id.toString()) : null;
                })
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        if (candidateIds.isEmpty()) {
             return Page.empty(PageRequest.of(page, size));
        }

        // Получаем ID книг, которые есть у пользователя (чтобы не советовать прочитанное)
        // Оптимизация: проверяем только среди кандидатов
        Set<Long> ownedBookIds = userBookRepository.findBookIdsByUser(currentUser.getId(), candidateIds);
        
        List<Long> finalBookIds = candidateIds.stream()
                .filter(id -> !ownedBookIds.contains(id))
                .collect(Collectors.toList());

        // 6. Загружаем полные данные и отдаем страницу
        List<Book> books = bookRepository.findAllById(finalBookIds);
        
        // Сортируем в порядке, в котором вернул VectorStore (по релевантности)
        // findAllById не гарантирует порядок
        Map<Long, Book> bookMap = books.stream().collect(Collectors.toMap(Book::getId, b -> b));
        
        List<BookReadDTO> resultingDtos = finalBookIds.stream()
                .map(bookMap::get)
                .filter(Objects::nonNull)
                .map(BookReadDTO::toDTO)
                .collect(Collectors.toList());
        
        // Ручная пагинация
        int start = Math.min((int)PageRequest.of(page, size).getOffset(), resultingDtos.size());
        int end = Math.min((start + size), resultingDtos.size());
        List<BookReadDTO> pageContent = resultingDtos.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), resultingDtos.size());
    }
    
    // Helper вытащить топ-N ключей по значению
    private List<String> getTopKeys(Map<String, Integer> map, int n) {
        return map.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .limit(n)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }

    public List<String> getUserTags() {
        return tagRepository.findByUser(getCurrentUser()).stream()
                .map(Tag::getName)
                .distinct()
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
}
