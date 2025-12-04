package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;
import java.util.List;

import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.UserBook;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserBookReadDTO {

    private Long id;
    private BookReadDTO book;
    private UserReadDTO user;
    private Integer progress;
    private Integer currentPage;
    private Integer totalPages;
    private Status status;
    private Integer rating;
    private LocalDateTime addedAt;
    private LocalDateTime updatedAt;
    private List<Tag> tags;
    private Boolean isFavorite;


    public static UserBookReadDTO toDTO(UserBook userBook) {
        return UserBookReadDTO.builder()
                .id(userBook.getId())
                .book(BookReadDTO.toDTO(userBook.getBook()))
                .user(UserReadDTO.toDTO(userBook.getUser()))
                .progress(userBook.getProgress())
                .currentPage(userBook.getCurrentPage())
                .totalPages(userBook.getTotalPages())
                .status(userBook.getStatus())
                .rating(userBook.getRating())
                .addedAt(userBook.getAddedAt())
                .updatedAt(userBook.getUpdatedAt())
                .tags(userBook.getTags())
                .isFavorite(userBook.getIsFavorite())
                .build();
    }
}
