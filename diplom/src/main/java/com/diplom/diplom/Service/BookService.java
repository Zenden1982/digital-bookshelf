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
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.DTO.BookSearchResultDTO;
import com.diplom.diplom.Repository.BookRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookService {

    private final BookRepository bookRepository;
    private final RestTemplate restTemplate;

    private final EmbeddingModel embeddingClient;
    private final VectorStore vectorStore;

    @Value("${google.books.api.url}")
    private String googleBooksApiUrl;

    @Value("${google.books.api.key}")
    private String googleBooksApiKey;

    // ========== CRUD операции ==========

    @Transactional
    public BookReadDTO addBook(BookCreateUpdateDTO bookCreateUpdateDTO) {
        Book savedBook = saveManualBook(bookCreateUpdateDTO);
        return BookReadDTO.toDTO(savedBook);
    }

    @Transactional
    public Page<BookReadDTO> getAllBooks(int page, int size) {
        return bookRepository.findAll(PageRequest.of(page, size))
                .map(BookReadDTO::toDTO);
    }

    @Transactional
    public BookReadDTO getBookById(Long id) {
        return bookRepository.findById(id)
                .map(BookReadDTO::toDTO)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
    }

    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new RuntimeException("Book not found with id: " + id);
        }
        bookRepository.deleteById(id);
    }

    // ========== Поиск ==========

    public BookSearchResultDTO combinedSearch(String query, Integer maxResults) {
        List<BookReadDTO> myBooks = searchInMyLibrary(query);
        List<BookReadDTO> googleBooks = searchBooks(query, maxResults);

        return BookSearchResultDTO.builder()
                .myLibraryBooks(myBooks)
                .googleBooks(googleBooks)
                .query(query)
                .totalMyBooks(myBooks.size())
                .totalGoogleBooks(googleBooks.size())
                .build();
    }

    public List<BookReadDTO> searchInMyLibrary(String query) {
        try {
            List<Book> books = bookRepository.searchByTitleOrAuthor(query);

            return books.stream()
                    .map(BookReadDTO::toDTO)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Ошибка при поиске в своей библиотеке: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<BookReadDTO> searchBooks(String query, Integer maxResults) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            // Явное кодирование query параметра
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());

            // Формирование URL без deprecated методов
            String urlString = googleBooksApiUrl +
                    "?q=" + encodedQuery +
                    "&langRestrict=ru" +
                    "&maxResults=" + (maxResults != null ? maxResults : 20) +
                    "&key=" + googleBooksApiKey;

            URI uri = URI.create(urlString);

            log.info("Выполняется запрос к Google Books API: {}", uri.toString());
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            if (response == null || !response.containsKey("items")) {
                log.info("Не найдено книг по запросу: {}", query);
                return Collections.emptyList();
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
            return items.stream()
                    .map(this::convertGoogleBookToDTO)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Ошибка при поиске в Google Books API: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    // ========== Google Books интеграция ==========

    @Transactional
    public Book saveBookFromGoogleBooks(String googleBookId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(googleBooksApiUrl + "/" + googleBookId)
                    .queryParam("key", googleBooksApiKey)
                    .toUriString();

            Map<String, Object> googleBook = restTemplate.getForObject(url, Map.class);

            if (googleBook == null) {
                throw new RuntimeException("Книга не найдена в Google Books");
            }

            BookReadDTO bookDTO = convertGoogleBookToDTO(googleBook);

            // Проверка на существование
            Optional<Book> existing = bookRepository.findByTitleAndAuthor(
                    bookDTO.getTitle(),
                    bookDTO.getAuthor());

            if (existing.isPresent()) {
                log.warn("Книга уже существует: {} - {}", bookDTO.getTitle(), bookDTO.getAuthor());
                return existing.get();
            }

            BookCreateUpdateDTO createDTO = BookCreateUpdateDTO.builder()
                    .title(bookDTO.getTitle())
                    .author(bookDTO.getAuthor())
                    .annotation(bookDTO.getAnnotation())
                    .pageCount(bookDTO.getPageCount())
                    .isbn(bookDTO.getIsbn())
                    .publishedDate(bookDTO.getPublishedDate())
                    .coverUrl(bookDTO.getCoverUrl())
                    .googleBookId(googleBookId)
                    .isAdded(true)
                    .build();

            Book book = BookCreateUpdateDTO.toBook(createDTO);
            book.setAddedAt(LocalDateTime.now());
            Book savedBook = bookRepository.save(book);
            generateAndSetEmbedding(savedBook);
            return savedBook;

        } catch (Exception e) {
            log.error("Ошибка при сохранении книги из Google Books: {}", e.getMessage(), e);
            throw new RuntimeException("Не удалось сохранить книгу: " + e.getMessage());
        }
    }

    @Transactional
    public Book saveManualBook(BookCreateUpdateDTO bookDTO) {
        Optional<Book> existingBook = bookRepository.findByTitleAndAuthor(
                bookDTO.getTitle(),
                bookDTO.getAuthor());

        if (existingBook.isPresent()) {
            throw new IllegalArgumentException("Книга уже существует");
        }

        Book book = BookCreateUpdateDTO.toBook(bookDTO);
        book.setIsAdded(true);
        book.setAddedAt(LocalDateTime.now());

        Book savedBook = bookRepository.save(book);

        generateAndSetEmbedding(savedBook);

        return savedBook;
    }

    public boolean bookExists(String title, String author) {
        return bookRepository.findByTitleAndAuthor(title, author).isPresent();
    }

    // ========== Вспомогательные методы ==========

    public List<BookReadDTO> findSimilarBooks(String query, int topK) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        log.info("Поиск похожих книг по запросу: '{}'", query);

        // 1. Создаем запрос для поиска похожих векторов
        SearchRequest request = SearchRequest.builder().query(query).topK(topK).similarityThreshold(0.5).build();

        // 2. Ищем похожие документы в VectorStore
        List<Document> similarDocuments = vectorStore.similaritySearch(request);

        log.info("Найдено {} похожих документов", similarDocuments.size());

        if (similarDocuments.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. Извлекаем ID книг из метаданных
        List<Long> similarBookIds = similarDocuments.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("book_id").toString()))
                .collect(Collectors.toList());

        // 4. Загружаем книги из репозитория
        return bookRepository.findAllById(similarBookIds)
                .stream()
                .map(BookReadDTO::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Генерирует и сохраняет вектор для книги в VectorStore
     */
    private void generateAndSetEmbedding(Book book) {
        if (book.getTitle() == null || book.getAnnotation() == null) {
            log.warn("Невозможно сгенерировать вектор для книги с id={}, так как отсутствует название или аннотация",
                    book.getId());
            return;
        }

        log.info("Генерация и сохранение вектора для книги: {}", book.getTitle());

        // 1. Формируем текст для генерации вектора
        String textToEmbed = book.getTitle() + ". " + book.getAuthor() + ". " + book.getAnnotation();

        // 2. Создаем метаданные для связи вектора с книгой
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("book_id", book.getId());
        metadata.put("title", book.getTitle());
        metadata.put("author", book.getAuthor());

        // 3. Создаем объект Document
        Document document = new Document(textToEmbed, metadata);

        // 4. Добавляем документ в VectorStore
        // Spring AI сам вызовет EmbeddingModel, сгенерирует вектор и сохранит его в
        // PostgreSQL
        vectorStore.add(List.of(document));

        log.info("Вектор для книги '{}' успешно сохранен в VectorStore", book.getTitle());
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
}
