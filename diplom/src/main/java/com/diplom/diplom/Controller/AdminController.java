package com.diplom.diplom.Controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diplom.diplom.Service.BookService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BookService bookService;

    @PostMapping("/regenerate-embeddings")
    public ResponseEntity<String> regenerateEmbeddings() {
        // Лучше запускать асинхронно, если книг много, но для простоты можно синхронно
        bookService.regenerateAllEmbeddings();
        return ResponseEntity.ok("Процесс перегенерации векторов запущен/завершен.");
    }

    @PostMapping(value = "/books/{bookId}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasRole('ADMIN')") // Раскомментируй, если настроен Security
    public ResponseEntity<String> uploadBookContentAdmin(
            @PathVariable Long bookId,
            @RequestPart("file") MultipartFile file) {

        try {
            String contentText = new String(file.getBytes(), StandardCharsets.UTF_8);

            bookService.uploadContentAsAdmin(bookId, contentText);

            return ResponseEntity.ok("Текст успешно сохранен для книги ID " + bookId);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Ошибка чтения файла");
        }
    }
}