package com.diplom.diplom.Entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_books")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class UserBook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long bookId;
    private Integer progress; // Progress in percentage (0-100)
    private Status status; // e.g., PLAN_TO_READ, READING, COMPLETED,
    private Integer rating; // User's rating for the book (1-5)
    private List<Note> notes; // User's personal notes about the book

    @CreatedDate
    private LocalDateTime addedAt; // Timestamp when the book was added to the user's list

    @LastModifiedDate
    private LocalDateTime updatedAt; // Timestamp of the last update to this entry

}
