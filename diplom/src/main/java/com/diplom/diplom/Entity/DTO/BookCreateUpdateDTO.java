package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;

import com.diplom.diplom.Entity.Book;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookCreateUpdateDTO {

    private Long id;

    private String title;

    private String author;

    private String annotation;

    private Integer pageCount;

    private String isbn;

    private LocalDateTime publishedDate;

    private Boolean isAdded;

    private String coverUrl;


    static public Book toBook(BookCreateUpdateDTO bookCreateUpdateDTO) {
        return Book.builder()
                .id(bookCreateUpdateDTO.getId())
                .title(bookCreateUpdateDTO.getTitle())
                .author(bookCreateUpdateDTO.getAuthor())
                .annotation(bookCreateUpdateDTO.getAnnotation())
                .pageCount(bookCreateUpdateDTO.getPageCount())
                .isbn(bookCreateUpdateDTO.getIsbn())
                .publishedDate(bookCreateUpdateDTO.getPublishedDate())
                .isAdded(bookCreateUpdateDTO.getIsAdded())
                .coverUrl(bookCreateUpdateDTO.getCoverUrl())
                .build();
    }
}



