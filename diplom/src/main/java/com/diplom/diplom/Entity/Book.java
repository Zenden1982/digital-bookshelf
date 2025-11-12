package com.diplom.diplom.Entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.validator.constraints.URL;
import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Entity
@Data
@Table(name = "books")
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty(message = "Название книги не может быть пустым")
    @Size(min = 1, max = 255, message = "Длина названия должна быть от 1 до 255 символов")
    private String title;

    @NotEmpty(message = "Имя автора не может быть пустым")
    @Size(min = 1, max = 255, message = "Длина имени автора должна быть от 1 до 255 символов")
    private String author;

    @Size(max = 2000, message = "Аннотация не может быть длиннее 2000 символов")
    private String annotation;

    @Min(value = 1, message = "Количество страниц должно быть больше 0")
    private Integer pageCount;

    private String isbn;

    private LocalDateTime publishedDate;

    private Boolean isAdded;
    @URL
    private String coverUrl;

    @CreatedDate
    private LocalDateTime addedAt;

    @OneToMany(mappedBy = "book")
    private List<ShelfItem> shelfItems = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "book")
    private List<UserBook> userBooks = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "book", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> notes = new java.util.ArrayList<>();
}
