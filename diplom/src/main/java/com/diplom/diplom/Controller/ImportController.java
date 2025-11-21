package com.diplom.diplom.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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
import com.diplom.diplom.Service.BookService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin/import")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('ADMIN')") // Раскомментируй, когда подключишь Spring
// Security
@SecurityRequirement(name = "BearerAuth")
public class ImportController {

    private final BookService bookService;

    /**
     * (АДМИН) Поиск книг в Google Books для импорта.
     */
    @GetMapping("/search-google")
    public ResponseEntity<Page<BookReadDTO>> searchGoogleBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<BookReadDTO> results = bookService.searchInGoogleBooks(query, page, size);
        return ResponseEntity.ok(results);
    }

    /**
     * (АДМИН) Импортировать книгу по ISBN.
     */
    @PostMapping("/isbn/{isbn}")
    public ResponseEntity<BookReadDTO> importByIsbn(@PathVariable String isbn) {
        Book importedBook = bookService.importBookByIsbn(isbn);
        // Используем маппер, чтобы вернуть DTO
        BookReadDTO bookDTO = BookReadDTO.toDTO(importedBook);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookDTO); // 201 Created ResponseEntity;
    }

    /**
     * (АДМИН) Обновить данные существующей книги.
     */
    @PutMapping("/books/{id}")
    public ResponseEntity<BookReadDTO> updateBook(
            @PathVariable Long id,
            @RequestBody BookCreateUpdateDTO bookDto) {

        BookReadDTO updatedBook = bookService.updateBook(id, bookDto);
        return ResponseEntity.ok(updatedBook);
    }

    /**
     * (АДМИН) Удалить книгу из базы.
     */
    @DeleteMapping("/books/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.noContent().build(); // Стандартный ответ для DELETE
    }

    @GetMapping("/search-by-title")
    public ResponseEntity<Page<BookReadDTO>> searchInLibraryByTitle(@RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BookReadDTO> books = bookService.searchGoogleBooksByTitle(query, page, size);
        return ResponseEntity.ok(books);
    }

    @GetMapping("/search-by-author")
    public ResponseEntity<Page<BookReadDTO>> searchInLibraryByAuthor(@RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BookReadDTO> books = bookService.searchGoogleBooksByAuthor(query, page, size);
        return ResponseEntity.ok(books);
    }
}
