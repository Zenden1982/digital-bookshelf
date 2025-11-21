package com.diplom.diplom.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}