package com.diplom.diplom.Entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Double id;

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

}
