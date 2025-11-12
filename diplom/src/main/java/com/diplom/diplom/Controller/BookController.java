package com.diplom.diplom.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Service.BookService;

import lombok.Data;

@RestController
@Data
public class BookController {

    private final BookService bookService;

    @GetMapping("/books")
    public ResponseEntity<Page<BookReadDTO>> getAllBooks(int page, int size) {
        return ResponseEntity.ok(bookService.getAllBooks(page, size));
    }

    @PostMapping("/books/add")
    public ResponseEntity<?> createBook(@RequestBody BookCreateUpdateDTO book) {
        bookService.addBook(book);
        return ResponseEntity.ok("Book created successfully");
    }
}
