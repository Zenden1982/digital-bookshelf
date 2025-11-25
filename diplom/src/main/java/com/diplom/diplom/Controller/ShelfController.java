package com.diplom.diplom.Controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Service.BookService;
import com.diplom.diplom.Service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/shelf")
@RequiredArgsConstructor
public class ShelfController {

    private final BookService bookService;
    private final UserService userService; // Для получения текущего юзера

    // ... другие методы полки ...

    /**
     * Загрузка текста для книги на полке.
     * Если книга была публичной, создается приватная копия, и ссылка на полке
     * подменяется.
     */
    @PostMapping(value = "/{userBookId}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadBookContent(
            @PathVariable Long userBookId,
            @RequestPart("file") MultipartFile file) {

        try {
            // Читаем текст из файла (предполагаем UTF-8)
            String contentText = new String(file.getBytes(), StandardCharsets.UTF_8);

            // Получаем текущего пользователя (через SecurityContext)
            String username = bookService.getCurrentUser().getUsername(); // Или как у тебя реализовано
            User currentUser = bookService.getCurrentUser();

            // Вызываем логику "форка"
            bookService.uploadPersonalBookContent(userBookId, contentText, currentUser);

            return ResponseEntity.ok("Текст успешно загружен. Создана личная копия книги.");

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при чтении файла: " + e.getMessage());
        }
    }
}
