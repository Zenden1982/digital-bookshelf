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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/shelf")
@RequiredArgsConstructor
public class ShelfController {

    private final BookService bookService;

    @PostMapping(value = "/{userBookId}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadBookContent(
            @PathVariable Long userBookId,
            @RequestPart("file") MultipartFile file) {

        try {
            String contentText = new String(file.getBytes(), StandardCharsets.UTF_8);

            User currentUser = bookService.getCurrentUser();

            bookService.uploadPersonalBookContent(userBookId, contentText, currentUser);

            return ResponseEntity.ok("Текст успешно загружен. Создана личная копия книги.");

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ошибка при чтении файла: " + e.getMessage());
        }
    }
}
