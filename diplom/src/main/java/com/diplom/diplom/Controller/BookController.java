package com.diplom.diplom.Controller;

import java.util.List;

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
    public ResponseEntity<List<BookReadDTO>> searchInLibrary(@RequestParam String query) {
        List<BookReadDTO> books = bookService.searchInMyLibrary(query);
        return ResponseEntity.ok(books);
    }

    /**
     * Найти книги, похожие на заданный текст (семантический поиск).
     */
    @GetMapping("/similar")
    public ResponseEntity<List<BookReadDTO>> findSimilarBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {

        List<BookReadDTO> similarBooks = bookService.findSimilarBooks(query, topK);
        return ResponseEntity.ok(similarBooks);
    }
}
