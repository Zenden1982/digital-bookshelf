package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;
import java.util.List;

import com.diplom.diplom.Entity.Book;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookReadDTO {
    private Long id;
    private String title;
    private String author;
    private String annotation;
    private Integer pageCount;
    private String isbn;
    private LocalDateTime publishedDate;
    private Boolean isAdded;
    private String coverUrl;
    private LocalDateTime addedAt;
    private List<String> genres;
    // Новые поля для идентификации источника
    private String source; // "MY_LIBRARY" или "GOOGLE_API"
    private String googleBookId; // ID книги в Google Books (если source = GOOGLE_API)

    static public BookReadDTO toDTO(Book book) {
        return BookReadDTO.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .annotation(book.getAnnotation())
                .pageCount(book.getPageCount())
                .isbn(book.getIsbn())
                .publishedDate(book.getPublishedDate())
                .isAdded(book.getIsAdded())
                .genres(book.getGenres())
                .googleBookId(book.getGoogleBookId())
                .coverUrl(book.getCoverUrl())
                .addedAt(book.getAddedAt())
                .source("MY_LIBRARY")
                .build();
    }
}
