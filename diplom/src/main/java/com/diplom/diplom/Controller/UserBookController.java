package com.diplom.diplom.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.DTO.UserBookCreateDTO;
import com.diplom.diplom.Entity.DTO.UserBookReadDTO;
import com.diplom.diplom.Entity.DTO.UserBookUpdateDTO;
import com.diplom.diplom.Service.UserBookService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/shelf")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
public class UserBookController {

    private final UserBookService userBookService;

    /**
     * Добавить книгу на "мою" полку.
     * POST /api/shelf
     */
    @PostMapping
    public ResponseEntity<UserBookReadDTO> addBookToMyShelf(@RequestBody UserBookCreateDTO dto) {
        String username = getCurrentUsername();
        return ResponseEntity.ok().body(userBookService.addBookToMyShelf(dto, username));
    }

    /**
     * Обновить состояние книги на "моей" полке.
     * PATCH /api/shelf
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserBookReadDTO> updateMyUserBook(@PathVariable Long id, @RequestBody UserBookUpdateDTO dto) {
        dto.setUserBookId(id);
        return ResponseEntity.ok(userBookService.updateMyUserBook(dto, getCurrentUsername()));
    }

    @GetMapping
    public ResponseEntity<Page<UserBookReadDTO>> getMyShelf(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Status status, // Фильтр по статусу
            @RequestParam(defaultValue = "id") String sort, // Сортировка по умолчанию по id
            @RequestParam(defaultValue = "DESC") String direction) {
        String username = getCurrentUsername();
        Page<UserBookReadDTO> shelf = userBookService.getMyShelf(username, page, size, status, sort, direction);
        return ResponseEntity.ok(shelf);
    }

    /**
     * Удалить книгу с "моей" полки.
     * DELETE /api/shelf/{id}
     */
    @DeleteMapping("/{id}")
    public void deleteMyUserBook(@PathVariable Long id) {
        userBookService.deleteMyUserBook(id, getCurrentUsername());
    }

    @GetMapping("/by-status")
    public ResponseEntity<Page<UserBookReadDTO>> getMyShelfByStatus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam String status) {
        String username = getCurrentUsername();
        Page<UserBookReadDTO> userBooks = userBookService.getMyShelfByStatus(page, size, username, status);
        return ResponseEntity.ok(userBooks);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {

            throw new IllegalStateException("Нет аутентифицированного пользователя");
        }
        return authentication.getName();
    }
}
