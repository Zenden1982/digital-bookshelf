package com.diplom.diplom.Entity.DTO;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.UserBook;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookDetailDTO {

    private BookReadDTO book;
    private UserBookReadDTO userBook;

    public static BookDetailDTO toDTO(Book book, UserBook userBook) {
        return BookDetailDTO.builder()
                .book(BookReadDTO.toDTO(book))
                .userBook((userBook == null) ? null : UserBookReadDTO.toDTO(userBook))
                .build();
    }
}
