package com.diplom.diplom.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.BookContent;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookDetailDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Exception.AccessDeniedException;
import com.diplom.diplom.Exception.ApiIntegrationException;
import com.diplom.diplom.Exception.DuplicateResourceException;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.BookContentRepository;
import com.diplom.diplom.Repository.BookRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// ПЕРЕДЕЛАТЬ ВЕКТОРЫ
@Service
@RequiredArgsConstructor
@Slf4j
public class BookService {

    private final BookRepository bookRepository;
    private final RestTemplate restTemplate;

    private final EmbeddingModel embeddingClient;
    private final VectorStore vectorStore;

    private final UserBookRepository userBookRepository;
    @Value("${google.books.api.url}")
    private String googleBooksApiUrl;

    @Value("${google.books.api.key}")
    private String googleBooksApiKey;

    private final UserRepository userRepository;

    private final BookContentRepository bookContentRepository;
    // ========== CRUD операции ==========

    @Transactional
    public Page<BookReadDTO> getAllBooks(int page, int size) {
        return bookRepository.findAll(PageRequest.of(page, size))
                .map(BookReadDTO::toDTO);
    }

    @Transactional
    public BookDetailDTO getBookById(Long id) {
        String userName = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(userName)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + userName));
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Книга не найдена: " + id));

        // 2. Пытаемся найти эту книгу на полке текущего пользователя.
        // Этот метод может вернуть null, и это нормально.
        UserBook userBook = userBookRepository.findByUserAndBook(user, book).orElse(null);

        // 3. Собираем финальный DTO из книги и (возможно) userBook.
        BookDetailDTO responseDTO = BookDetailDTO.toDTO(book, userBook);

        return responseDTO;
    }

    @Transactional
    public BookReadDTO updateBook(Long id, BookCreateUpdateDTO bookCreateUpdateDTO) {
        if (id == null) {
            throw new IllegalArgumentException("Book ID cannot be null");
        }

        return bookRepository.findById(id)
                .map(existingBook -> {
                    if (bookCreateUpdateDTO.getTitle() != null) {
                        existingBook.setTitle(bookCreateUpdateDTO.getTitle());
                    }
                    if (bookCreateUpdateDTO.getAuthor() != null) {
                        existingBook.setAuthor(bookCreateUpdateDTO.getAuthor());
                    }
                    if (bookCreateUpdateDTO.getAnnotation() != null) {
                        existingBook.setAnnotation(bookCreateUpdateDTO.getAnnotation());
                    }
                    if (bookCreateUpdateDTO.getPublishedDate() != null) {
                        existingBook.setPublishedDate(bookCreateUpdateDTO.getPublishedDate());
                    }
                    if (bookCreateUpdateDTO.getPageCount() != null) {
                        existingBook.setPageCount(bookCreateUpdateDTO.getPageCount());
                    }
                    if (bookCreateUpdateDTO.getIsbn() != null) {
                        existingBook.setIsbn(bookCreateUpdateDTO.getIsbn());
                    }
                    if (bookCreateUpdateDTO.getCoverUrl() != null) {
                        existingBook.setCoverUrl(bookCreateUpdateDTO.getCoverUrl());
                    }
                    generateAndSetEmbedding(existingBook);
                    return BookReadDTO.toDTO(bookRepository.save(existingBook));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Книга с id: " + id + " не найдена"));
    }

    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new ResourceNotFoundException("Книга с id: " + id + " не найдена");
        }
        bookRepository.deleteById(id);
    }

    @Transactional
    public Page<BookReadDTO> searchInMyLibrary(String query, int page, int size) {

        if (query == null || query.trim().isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }
        try {
            User user = getCurrentUser();
            Page<Book> books = bookRepository.searchByTitleOrAuthorOrIsbn(
                    query,
                    PageRequest.of(page, size));
            List<Long> bookIds = books.map(Book::getId).getContent();
            Set<Long> addedBookIds = userBookRepository.findBookIdsByUser(user.getId(), bookIds);
            return books.map(book -> {
                BookReadDTO dto = mapToBookReadDTO(book);
                dto.setIsAdded(addedBookIds.contains(book.getId()));
                return dto;
            });

        } catch (Exception e) {
            log.error("Ошибка при поиске в своей библиотеке: {}", e.getMessage(), e);
            throw new ApiIntegrationException("Ошибка при поиске в своей библиотеке: " + e.getMessage(), e);
        }
    }

    public Page<BookReadDTO> searchInGoogleBooks(String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }
        try {
            String searchQuery = isIsbnFormat(query) ? "isbn:" + query.replace("-", "") : query;
            String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);

            int maxResults = size * 3;

            URI uri = URI.create(googleBooksApiUrl
                    + "?q=" + encodedQuery
                    + "&langRestrict=ru"
                    + "&maxResults=" + maxResults
                    + "&key=" + googleBooksApiKey);

            log.info("Запрос к Google Books API: {}", uri);
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            if (response == null || !response.containsKey("items")) {
                return Page.empty(PageRequest.of(page, size));
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");

            List<BookReadDTO> allResults = items.stream()
                    .map(this::convertGoogleBookToDTO)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            List<String> isbns = allResults.stream()
                    .map(BookReadDTO::getIsbn)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            Set<String> existingIds = isbns.isEmpty()
                    ? Collections.emptySet()
                    : bookRepository.findExistingIsbns(isbns);

            List<BookReadDTO> filteredResults = allResults.stream()
                    .filter(dto -> !existingIds.contains(dto.getIsbn()))
                    .collect(Collectors.toList());

            // Ручная пагинация по списку allResults
            Pageable pageable = PageRequest.of(page, size);
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), filteredResults.size());
            if (start >= filteredResults.size()) {
                return new PageImpl<>(Collections.emptyList(), pageable, filteredResults.size());
            }

            List<BookReadDTO> pageContent = filteredResults.subList(start, end);
            return new PageImpl<>(pageContent, pageable, filteredResults.size());

        } catch (Exception e) {
            log.error("Ошибка при поиске в Google Books API: {}", e.getMessage(), e);
            return Page.empty(PageRequest.of(page, size));
        }
    }

    @Transactional
    public Book importBookByIsbn(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN не может быть пустым");
        }
        Optional<Book> existingBook = bookRepository.findByIsbn(isbn);
        if (existingBook.isPresent()) {
            throw new DuplicateResourceException("Книга с ISBN" + isbn + "уже существует.");
        }

        List<BookReadDTO> googleResults = searchInGoogleBooks(isbn, 0, 1).getContent();
        if (googleResults.isEmpty() || googleResults.get(0) == null) {
            throw new ResourceNotFoundException("Книга с ISBN " + isbn + " не найдена в Google Books.");
        }

        return importBook(googleResults.get(0));
    }

    private Book importBook(BookReadDTO bookDTO) {
        Book bookToSave = Book.builder()
                .title(bookDTO.getTitle())
                .author(bookDTO.getAuthor())
                .annotation(bookDTO.getAnnotation())
                .pageCount(bookDTO.getPageCount())
                .isbn(bookDTO.getIsbn())
                .genres(bookDTO.getGenres())
                .publishedDate(bookDTO.getPublishedDate())
                .coverUrl(bookDTO.getCoverUrl())
                .googleBookId(bookDTO.getGoogleBookId())
                .addedAt(LocalDateTime.now())
                .build();

        Book savedBook = bookRepository.save(bookToSave);
        generateAndSetEmbedding(savedBook);
        log.info("Книга '{}' успешно импортирована.", savedBook.getTitle());
        return savedBook;
    }

    private boolean isIsbnFormat(String query) {
        return query.matches("^[0-9\\-]+$");
    }

    // ========== Вспомогательные методы ==========

    public Page<BookReadDTO> findSimilarBooks(String query, int topK, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }

        SearchRequest request = SearchRequest.builder()
                .query(query)
                .topK(topK)
                .similarityThreshold(0.5)
                .build();

        List<Document> similarDocs = vectorStore.similaritySearch(request);
        List<Long> bookIds = similarDocs.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("book_id").toString()))
                .collect(Collectors.toList());

        List<BookReadDTO> dtoList = bookRepository.findAllById(bookIds).stream()
                .map(this::mapToBookReadDTO)
                .collect(Collectors.toList());

        // Простая "ручная" обёртка в Page
        PageRequest pageRequest = PageRequest.of(page, size);
        int start = (int) pageRequest.getOffset();
        int end = Math.min(start + pageRequest.getPageSize(), dtoList.size());
        List<BookReadDTO> pageContent = start >= dtoList.size() ? List.of() : dtoList.subList(start, end);

        return new PageImpl<>(pageContent, pageRequest, dtoList.size());
    }

    /**
     * Генерирует и сохраняет вектор для книги в VectorStore
     */
    private void generateAndSetEmbedding(Book book) {
        if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
            log.warn("Невозможно сгенерировать вектор для книги с id={}, так как отсутствует название.", book.getId());
            return;
        }

        log.info("Генерация и сохранение вектора для книги: {}", book.getTitle());

        StringBuilder textToEmbed = new StringBuilder();

        textToEmbed.append("Название: ").append(book.getTitle()).append("\n");

        if (book.getAuthor() != null && !book.getAuthor().trim().isEmpty()) {
            textToEmbed.append("Автор: ").append(book.getAuthor()).append("\n");
        }

        if (book.getGenres() != null && !book.getGenres().isEmpty()) {
            textToEmbed.append("Жанры: ").append(String.join(", ", book.getGenres())).append("\n");
        }

        if (book.getAnnotation() != null && !book.getAnnotation().trim().isEmpty()) {
            String cleanAnnotation = book.getAnnotation().replaceAll("<[^>]*>", "");
            textToEmbed.append("Аннотация: ").append(cleanAnnotation);
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("book_id", book.getId());
        metadata.put("title", book.getTitle());
        metadata.put("author", book.getAuthor());

        Document document = new Document(textToEmbed.toString(), metadata);
        vectorStore.add(List.of(document));

        log.info("Вектор для книги '{}' успешно сохранен в VectorStore", book.getTitle());
    }

    public List<BookReadDTO> findSimilarBooksByBookId(Long bookId, int limit) {
        Book sourceBook = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Книга с ID " + bookId + " не найдена"));

        // 1. Формируем "УМНЫЙ" запрос, идентичный тому, что используется при генерации
        // вектора
        StringBuilder queryBuilder = new StringBuilder();

        if (sourceBook.getTitle() != null) {
            queryBuilder.append("Название: ").append(sourceBook.getTitle()).append("\n");
        }
        if (sourceBook.getAuthor() != null) {
            queryBuilder.append("Автор: ").append(sourceBook.getAuthor()).append("\n");
        }

        if (sourceBook.getGenres() != null) {
            queryBuilder.append("Жанры: ").append(sourceBook.getGenres()).append("\n");
        }

        if (sourceBook.getAnnotation() != null) {
            queryBuilder.append("Аннотация: ").append(sourceBook.getAnnotation());
        }

        String queryText = queryBuilder.toString();

        if (queryText.trim().isEmpty()) {
            log.warn("Недостаточно данных для поиска похожих книг (id={})", bookId);
            return Collections.emptyList();
        }

        SearchRequest request = SearchRequest.builder()
                .query(queryText)
                .topK(limit + 1)
                .similarityThreshold(0.5)
                .build();

        List<Document> similarDocuments = vectorStore.similaritySearch(request);

        List<Long> similarBookIds = similarDocuments.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("book_id").toString()))
                .filter(id -> !id.equals(bookId))
                .limit(limit)
                .collect(Collectors.toList());

        if (similarBookIds.isEmpty()) {
            return Collections.emptyList();
        }

        return bookRepository.findAllById(similarBookIds).stream()
                .map(this::mapToBookReadDTO)
                .collect(Collectors.toList());
    }

    private BookReadDTO convertGoogleBookToDTO(Map<String, Object> googleBook) {
        try {
            String googleBookId = (String) googleBook.get("id");
            Map<String, Object> volumeInfo = (Map<String, Object>) googleBook.get("volumeInfo");

            if (volumeInfo == null) {
                return null;
            }

            BookReadDTO.BookReadDTOBuilder builder = BookReadDTO.builder();

            builder.googleBookId(googleBookId);
            builder.source("GOOGLE_API");
            builder.title((String) volumeInfo.get("title"));

            List<String> authors = (List<String>) volumeInfo.get("authors");
            if (authors != null && !authors.isEmpty()) {
                builder.author(String.join(", ", authors));
            }
            List<String> categories = (List<String>) volumeInfo.get("categories");
            if (categories != null && !categories.isEmpty()) {
                builder.genres(categories);
            }
            builder.annotation((String) volumeInfo.get("description"));

            Object pageCountObj = volumeInfo.get("pageCount");
            if (pageCountObj != null) {
                builder.pageCount(((Number) pageCountObj).intValue());
            }

            List<Map<String, String>> identifiers = (List<Map<String, String>>) volumeInfo.get("industryIdentifiers");
            if (identifiers != null && !identifiers.isEmpty()) {
                builder.isbn(identifiers.get(0).get("identifier"));
            }

            String publishedDateStr = (String) volumeInfo.get("publishedDate");
            if (publishedDateStr != null) {
                try {
                    builder.publishedDate(parsePublishedDate(publishedDateStr));
                } catch (Exception e) {
                    log.warn("Не удалось распарсить дату: {}", publishedDateStr);
                }
            }

            Map<String, String> imageLinks = (Map<String, String>) volumeInfo.get("imageLinks");
            if (imageLinks != null) {
                String coverUrl = imageLinks.get("thumbnail");
                if (coverUrl != null) {
                    builder.coverUrl(coverUrl.replace("http://", "https://"));
                }
            }

            builder.isAdded(false);

            return builder.build();

        } catch (Exception e) {
            log.error("Ошибка при конвертации Google Book: {}", e.getMessage());
            return null;
        }
    }

    private LocalDateTime parsePublishedDate(String dateStr) {
        if (dateStr.length() == 4) {
            return LocalDateTime.of(Integer.parseInt(dateStr), 1, 1, 0, 0);
        } else if (dateStr.length() == 7) {
            String[] parts = dateStr.split("-");
            return LocalDateTime.of(
                    Integer.parseInt(parts[0]),
                    Integer.parseInt(parts[1]),
                    1, 0, 0);
        } else {
            return LocalDateTime.parse(dateStr + "T00:00:00");
        }
    }

    private BookReadDTO mapToBookReadDTO(Book book) {
        return BookReadDTO.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .annotation(book.getAnnotation())
                .pageCount(book.getPageCount())
                .isbn(book.getIsbn())
                .publishedDate(book.getPublishedDate())
                .coverUrl(book.getCoverUrl())
                .googleBookId(book.getGoogleBookId())
                .build();
    }

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + username));
    }

    public Page<BookReadDTO> searchGoogleBooksByTitle(String title, int page, int size) {
        return searchGoogleBooksAdvanced("intitle", title, page, size);
    }

    public Page<BookReadDTO> searchGoogleBooksByAuthor(String author, int page, int size) {
        return searchGoogleBooksAdvanced("inauthor", author, page, size);
    }

    private Page<BookReadDTO> searchGoogleBooksAdvanced(String field, String query, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return Page.empty(PageRequest.of(page, size));
        }
        try {
            String encodedQuery = URLEncoder.encode(field + ":" + query, StandardCharsets.UTF_8);

            int maxResults = size * 3;
            int startIndex = page * size;

            URI uri = URI.create(googleBooksApiUrl
                    + "?q=" + encodedQuery
                    + "&langRestrict=ru"
                    + "&maxResults=" + maxResults
                    + "&startIndex=" + startIndex
                    + "&key=" + googleBooksApiKey);

            log.info("Запрос к Google Books API: {}", uri);
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            if (response == null || !response.containsKey("items")) {
                return Page.empty(PageRequest.of(page, size));
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");

            List<BookReadDTO> allResults = items.stream()
                    .map(this::convertGoogleBookToDTO)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Pageable pageable = PageRequest.of(page, size);
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), allResults.size());
            if (start >= allResults.size()) {
                return new PageImpl<>(Collections.emptyList(), pageable, allResults.size());
            }

            List<BookReadDTO> pageContent = allResults.subList(start, end);
            return new PageImpl<>(pageContent, pageable, allResults.size());

        } catch (Exception e) {
            log.error("Ошибка при поиске в Google Books API: {}", e.getMessage(), e);
            return Page.empty(PageRequest.of(page, size));
        }
    }

    @Transactional // Важно, если generateAndSetEmbedding что-то пишет в БД (а он пишет)
    public void regenerateAllEmbeddings() {
        log.info("Начинаем перегенерацию векторов для всех книг...");

        // 1. Получаем все книги (для больших баз лучше использовать пагинацию или
        // Stream)
        List<Book> allBooks = bookRepository.findAll();

        int count = 0;
        for (Book book : allBooks) {
            try {
                // 2. Вызываем твой обновленный метод генерации
                generateAndSetEmbedding(book);
                count++;

                // Логируем прогресс каждые 50 книг
                if (count % 50 == 0) {
                    log.info("Обработано {} книг...", count);
                }
            } catch (Exception e) {
                log.error("Ошибка при генерации вектора для книги ID {}: {}", book.getId(), e.getMessage());
                // Не прерываем процесс из-за одной ошибки
            }
        }

        log.info("Перегенерация завершена. Всего обновлено: {}", count);
    }

    @Transactional
    public void uploadPersonalBookContent(Long userBookId, String contentText, User currentUser) {
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("Запись на полке не найдена: " + userBookId));

        if (!userBook.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Вы не можете изменять чужую полку");
        }

        Book currentBook = userBook.getBook();

        if (currentUser.equals(currentBook.getOwner())) {
            log.info("Книга ID {} уже является личной копией. Обновляем текст.", currentBook.getId());
            saveOrUpdateBookContent(currentBook, contentText);
            return;
        }

        log.info("Книга ID {} публичная. Создаем личную копию для пользователя {}", currentBook.getId(),
                currentUser.getUsername());

        Book personalCopy = new Book();

        personalCopy.setTitle(currentBook.getTitle());
        personalCopy.setAuthor(currentBook.getAuthor());
        personalCopy.setAnnotation(currentBook.getAnnotation());
        personalCopy.setPageCount(currentBook.getPageCount());
        personalCopy.setIsbn(currentBook.getIsbn());
        personalCopy.setPublishedDate(currentBook.getPublishedDate());
        personalCopy.setCoverUrl(currentBook.getCoverUrl());
        personalCopy.setGoogleBookId(currentBook.getGoogleBookId());
        personalCopy.setGenres(currentBook.getGenres());
        personalCopy.setAddedAt(LocalDateTime.now());

        personalCopy.setOwner(currentUser);

        Book savedPersonalCopy = bookRepository.save(personalCopy);

        generateAndSetEmbedding(savedPersonalCopy);

        saveOrUpdateBookContent(savedPersonalCopy, contentText);

        userBook.setBook(savedPersonalCopy);

        // Опционально: Сбрасываем прогресс, т.к. текст новый
        // userBook.setProgress(0);
        // userBook.setCurrentPage(0);

        userBookRepository.save(userBook);

        log.info("Подмена завершена. UserBook ID {} теперь ссылается на Book ID {}", userBook.getId(),
                savedPersonalCopy.getId());
    }

    /**
     * Вспомогательный метод для сохранения текста в таблицу book_contents
     */
    private void saveOrUpdateBookContent(Book book, String content) {
        BookContent bookContent = bookContentRepository.findById(book.getId())
                .orElse(new BookContent(book.getId(), book, content));

        bookContent.setContent(content);
        bookContentRepository.save(bookContent);
    }

    public String getBookContent(Long bookId) {
        return bookContentRepository.findById(bookId)
                .map(BookContent::getContent)
                .orElse(null); // Или вернуть заглушку, если текста нет
    }

    @Transactional
    public void uploadContentAsAdmin(Long bookId, String contentText) {
        // 1. Загружаем книгу
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Книга не найдена: " + bookId));

        // 2. Ищем СУЩЕСТВУЮЩИЙ контент через репозиторий контента (или через книгу,
        // если настроено lazy)
        BookContent bookContent = bookContentRepository.findById(bookId)
                .orElse(null);

        if (bookContent == null) {
            // Если контента нет - создаем новый
            bookContent = new BookContent();
            bookContent.setBook(book); // Важно установить связь
            // ID установится автоматически благодаря @MapsId при сохранении,
            // но для надежности можно явно не сетить, а просто связать с book
        }

        // 3. Обновляем текст
        bookContent.setContent(contentText);

        // 4. Сохраняем
        bookContentRepository.save(bookContent);

        log.info("Администратор загрузил текст для книги ID {}", bookId);
    }
}
