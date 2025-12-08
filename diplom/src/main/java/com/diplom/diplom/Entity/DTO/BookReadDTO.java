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
    private String source;
    private String googleBookId;
    private String semanticColor;
    private Boolean hasContent;

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
                .semanticColor(book.getSemanticColor())
                .googleBookId(book.getGoogleBookId())
                .coverUrl(book.getCoverUrl())
                .addedAt(book.getAddedAt())
                .hasContent(Boolean.TRUE.equals(book.getHasBookContent()))
                .source("MY_LIBRARY")
                .build();
    }
}
