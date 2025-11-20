package com.diplom.diplom.Entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.validator.constraints.URL;
import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Table(name = "books")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty(message = "Название книги не может быть пустым")
    @Size(min = 1, max = 1000, message = "Длина названия должна быть от 1 до 1000символов")
    @Column(length = 1000)
    private String title;

    @NotEmpty(message = "Имя автора не может быть пустым")
    @Size(min = 1, max = 1000, message = "Длина имени автора должна быть от 1 до255 символов")
    @Column(length = 1000)
    private String author;

    @Size(max = 20000, message = "Аннотация не может быть длиннее 2000 символов")
    @Column(length = 20000)
    private String annotation;

    @Min(value = 1, message = "Количество страниц должно быть больше 0")
    private Integer pageCount;

    private String isbn;

    private List<String> genres;

    private String googleBookId;

    private LocalDateTime publishedDate;

    private Boolean isAdded;

    @URL
    @Lob
    private String coverUrl;

    @CreatedDate
    private LocalDateTime addedAt;

    @OneToMany(mappedBy = "book")
    @Builder.Default
    private List<ShelfItem> shelfItems = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "book")
    @Builder.Default
    private List<UserBook> userBooks = new java.util.ArrayList<>();

}
