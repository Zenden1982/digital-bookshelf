package com.diplom.diplom.Entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty
    @Size(min = 2, max = 30, message = "Имя пользователя должно быть от 2 до 30 символов")
    private String username;

    @NotEmpty
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;

    @NotEmpty
    @Email(message = "Некорректный email")
    private String email;

    @CreatedDate
    private LocalDateTime created_at;
    private Role role;

    @OneToMany(mappedBy = "user")
    private List<Shelf> shelves = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> notes = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<UserBook> userBooks = new java.util.ArrayList<>();

}
