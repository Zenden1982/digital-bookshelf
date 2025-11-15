package com.diplom.diplom.Controller;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.UserBookCreateDTO;
import com.diplom.diplom.Entity.DTO.UserBookUpdateDTO;
import com.diplom.diplom.Service.UserBookService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/shelf")
@RequiredArgsConstructor
public class UserBookController {

    private final UserBookService userBookService;

    /**
     * Добавить книгу на "мою" полку.
     * POST /api/shelf
     */
    @PostMapping
    public UserBook addBookToMyShelf(@RequestBody UserBookCreateDTO dto) {
        String username = getCurrentUsername();
        return userBookService.addBookToMyShelf(dto, username);
    }

    /**
     * Обновить состояние книги на "моей" полке.
     * PATCH /api/shelf
     */
    @PatchMapping
    public UserBook updateMyUserBook(@RequestBody UserBookUpdateDTO dto) {
        // userBookId теперь приходит в теле запроса (в DTO)
        return userBookService.updateMyUserBook(dto, getCurrentUsername());
    }

    /**
     * Получить "мою" полку.
     * GET /api/shelf?page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<UserBook>> getMyShelf(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String username = getCurrentUsername();
        Page<UserBook> userBooks = userBookService.getMyShelf(page, size, username);
        return ResponseEntity.ok(userBooks);
    }

    /**
     * Удалить книгу с "моей" полки.
     * DELETE /api/shelf/{id}
     */
    @DeleteMapping("/{id}")
    public void deleteMyUserBook(@PathVariable Long id) {
        userBookService.deleteMyUserBook(id, getCurrentUsername());
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {

            throw new IllegalStateException("Нет аутентифицированного пользователя");
        }
        return authentication.getName();
    }
}
