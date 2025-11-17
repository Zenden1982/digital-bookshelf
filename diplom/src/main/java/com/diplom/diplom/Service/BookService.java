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

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Exception.ApiIntegrationException;
import com.diplom.diplom.Exception.DuplicateResourceException;
import com.diplom.diplom.Exception.ResourceNotFoundException;
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
    public Page<BookReadDTO> getAllBooks(int page, int size) {
        return bookRepository.findAll(PageRequest.of(page, size))
                .map(BookReadDTO::toDTO);
    }

    @Transactional
    public BookReadDTO getBookById(Long id) {
        return bookRepository.findById(id)
                .map(BookReadDTO::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Книга с ID: " + id + " не найдена"));
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
    public List<BookReadDTO> searchInMyLibrary(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            List<Book> books = bookRepository.searchByTitleOrAuthorOrIsbn(query);
            return books.stream()
                    .map(this::mapToBookReadDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Ошибка при поиске в своей библиотеке: {}", e.getMessage(), e);
            throw new ApiIntegrationException("Ошибка при поиске в Google Books API: " + e.getMessage(), e);
        }
    }

    public List<BookReadDTO> searchInGoogleBooks(String query, int maxResults) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            String searchQuery = isIsbnFormat(query) ? "isbn:" + query.replace("-", "") : query;
            String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);

            URI uri = URI.create(googleBooksApiUrl + "?q=" + encodedQuery + "&langRestrict=ru"
                    + "&maxResults=" + maxResults + "&key=" + googleBooksApiKey);

            log.info("Запрос к Google Books API: {}", uri);
            Map<String, Object> response = restTemplate.getForObject(uri, Map.class);

            if (response == null || !response.containsKey("items")) {
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

    @Transactional
    public Book importBookByIsbn(String isbn) {
        if (isbn == null || isbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN не может быть пустым");
        }
        Optional<Book> existingBook = bookRepository.findByIsbn(isbn);
        if (existingBook.isPresent()) {
            throw new DuplicateResourceException("Книга с ISBN" + isbn + "уже существует.");
        }

        List<BookReadDTO> googleResults = searchInGoogleBooks(isbn, 1);
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

    public List<BookReadDTO> findSimilarBooks(String query, int topK) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
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
        return bookRepository.findAllById(bookIds).stream()
                .map(this::mapToBookReadDTO)
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
}
