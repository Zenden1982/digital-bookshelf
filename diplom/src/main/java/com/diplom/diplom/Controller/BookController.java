package com.diplom.diplom.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Service.BookService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
public class BookController {

    private final BookService bookService;

    /**
     * Получить все книги из нашей базы с пагинацией.
     */
    @GetMapping
    public ResponseEntity<Page<BookReadDTO>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<BookReadDTO> books = bookService.getAllBooks(page, size);
        return ResponseEntity.ok(books);
    }

    /**
     * Получить конкретную книгу по ее ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookReadDTO> getBookById(@PathVariable Long id) {
        BookReadDTO book = bookService.getBookById(id);
        return ResponseEntity.ok(book);
    }

    /**
     * Поиск книг в нашей библиотеке по названию, автору или ISBN.
     */
    @GetMapping("/search")
    public ResponseEntity<Page<BookReadDTO>> searchInLibrary(@RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BookReadDTO> books = bookService.searchInMyLibrary(query, page, size);
        return ResponseEntity.ok(books);
    }

    /**
     * Найти книги, похожие на заданный текст (семантический поиск).
     */
    @GetMapping("/similar")
    public ResponseEntity<Page<BookReadDTO>> findSimilarBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<BookReadDTO> similarBooks = bookService.findSimilarBooks(query, topK, page, size);
        return ResponseEntity.ok(similarBooks);
    }
}
