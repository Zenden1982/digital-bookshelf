package com.diplom.diplom.Entity.DTO;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSearchResultDTO {
    private List<BookReadDTO> myLibraryBooks; // Книги из вашей БД
    private List<BookReadDTO> googleBooks; // Книги из Google API
    private String query;
    private Integer totalMyBooks;
    private Integer totalGoogleBooks;
}
