package com.diplom.diplom.Entity;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {

    @NotBlank(message = "Имя пользователя или email не могут быть пустыми")
    private String username;

    @NotBlank(message = "Пароль не может быть пустым")
    private String password;
}
