package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;

import com.diplom.diplom.Entity.Status;

import lombok.Data;

@Data
public class UserBookReadDTO {

    private Long id;
    private BookReadDTO book;
    private UserReadDTO user;
    private Integer progress;
    private Status status;
    private Integer rating;
    private LocalDateTime addedAt;
    private LocalDateTime updatedAt;
}
