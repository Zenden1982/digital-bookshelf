package com.diplom.diplom.Controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.DTO.BookSearchResultDTO;
import com.diplom.diplom.Service.BookService;

import lombok.Data;

@RestController
@Data
@RequestMapping("/api/v1/books")
public class BookController {

    private final BookService bookService;

    @GetMapping("/")
    public ResponseEntity<Page<BookReadDTO>> getAllBooks(@RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(bookService.getAllBooks(page, size));
    }

    @PostMapping("/add")
    public ResponseEntity<BookReadDTO> createBook(@RequestBody BookCreateUpdateDTO book) {

        return ResponseEntity.ok(bookService.addBook(book));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookReadDTO> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookReadDTO> updateBook(
            @PathVariable Long id,
            @RequestBody BookCreateUpdateDTO book) {
        return ResponseEntity.ok(bookService.updateBook(id, book));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok("Book deleted successfully");
    }

    @GetMapping("/search")
    public ResponseEntity<BookSearchResultDTO> combinedSearch(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "20") Integer maxResults) {

        BookSearchResultDTO result = bookService.combinedSearch(query, maxResults);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/save-from-google/{googleBookId}")
    public ResponseEntity<BookReadDTO> saveFromGoogleBooks(@PathVariable String googleBookId) {
        Book savedBook = bookService.saveBookFromGoogleBooks(googleBookId);
        return ResponseEntity.ok(BookReadDTO.toDTO(savedBook));
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> checkBookExists(
            @RequestParam String title,
            @RequestParam String author) {

        boolean exists = bookService.bookExists(title, author);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/similar")
    public ResponseEntity<List<BookReadDTO>> findSimilarBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int topK) {

        List<BookReadDTO> similarBooks = bookService.findSimilarBooks(query, topK);
        return ResponseEntity.ok(similarBooks);
    }
}
