package com.diplom.diplom.Controller;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Service.BookService;
import com.diplom.diplom.Service.FileParserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BookService bookService;
    private final FileParserService fileParserService; // <-- Добавили

    @PostMapping("/regenerate-embeddings")
    public ResponseEntity<String> regenerateEmbeddings() {
        bookService.regenerateAllEmbeddings();
        return ResponseEntity.ok("Процесс перегенерации векторов запущен/завершен.");
    }

    @PostMapping("/books")
    public ResponseEntity<BookReadDTO> createBook(@RequestBody BookCreateUpdateDTO bookCreateUpdateDTO)
            throws IOException {
        return ResponseEntity.ok(bookService.addBook(bookCreateUpdateDTO));
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<String> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping(value = "/books/{bookId}/content", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadBookContentAdmin(
            @PathVariable Long bookId,
            @RequestPart("file") MultipartFile file) {

        try {
            // ВМЕСТО: String contentText = new String(file.getBytes(), ...);
            // ПИШЕМ:
            String contentText = fileParserService.parseContent(file);

            if (contentText.isEmpty()) {
                return ResponseEntity.badRequest().body("Не удалось извлечь текст из файла.");
            }

            bookService.uploadContentAsAdmin(bookId, contentText);
            return ResponseEntity.ok("Текст успешно сохранен (распознано символов: " + contentText.length() + ")");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Ошибка обработки файла: " + e.getMessage());
        }
    }
}