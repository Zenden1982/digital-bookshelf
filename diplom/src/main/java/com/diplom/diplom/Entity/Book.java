package com.diplom.diplom.Entity;

import java.time.LocalDateTime;

import org.hibernate.validator.constraints.URL;
import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "books")
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

    @URL
    private String coverUrl;

    @NotNull(message = "Статус книги не может быть пустым")
    private Status status;

    @Min(value = 0, message = "Прогресс не может быть отрицательным")
    @Max(value = 100, message = "Прогресс не может быть больше 100")
    private Integer progress;

    @Min(value = 0, message = "Рейтинг должен быть от 0 до 5")
    @Max(value = 5, message = "Рейтинг должен быть от 0 до 5")
    private Integer rating;

    @CreatedDate
    private LocalDateTime addedAt;

}
