package com.diplom.diplom.Controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.DTO.BookDTO;
import com.diplom.diplom.Repository.BookRepository;

import lombok.Data;

@RestController
@Data
public class BookController {

    private final BookRepository bookRepository;

    @GetMapping("/books")
    public ResponseEntity<?> getAllBooks(int page, int size) {
        return ResponseEntity.ok(bookRepository.findAll(PageRequest.of(page, size)).map((book) -> {
            BookDTO dto = new BookDTO();
            dto.setTitle(book.getTitle());
            dto.setAuthor(book.getAuthor());
            dto.setImageUrl(book.getCoverUrl());
            dto.setDescription(book.getAnnotation());
            return dto;
        }));
    }

    @PostMapping("/books/add")
    public ResponseEntity<?> createBook(@RequestBody Book book) {
        bookRepository.save(book);
        return ResponseEntity.ok("Book created successfully");
    }
}
