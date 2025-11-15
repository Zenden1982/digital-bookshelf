package com.diplom.diplom.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.UserBookCreateDTO;
import com.diplom.diplom.Entity.DTO.UserBookUpdateDTO;
import com.diplom.diplom.Repository.BookRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
public class UserBookService {

    private final UserBookRepository userBookRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    /**
     * Добавить книгу на полку ТЕКУЩЕГО пользователя, сразу указав статус.
     */
    public UserBook addBookToMyShelf(UserBookCreateDTO dto, String currentUsername) {
        Book book = bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new IllegalArgumentException("Книга не найдена: " + dto.getBookId()));
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        // Запретить дубликаты
        userBookRepository.findByUserAndBook(currentUser, book).ifPresent(ub -> {
            throw new IllegalArgumentException("Эта книга уже есть на вашей полке");
        });

        UserBook userBook = UserBook.builder()
                .user(currentUser)
                .book(book)
                .progress(0)
                .currentPage(0)
                .status(dto.getStatus()) // Дефолтный статус
                .build();

        return userBookRepository.save(userBook);
    }

    /**
     * Обновить состояние книги на полке ТЕКУЩЕГО пользователя.
     */
    public UserBook updateMyUserBook(UserBookUpdateDTO dto, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        UserBook userBook = userBookRepository.findById(dto.getUserBookId())
                .orElseThrow(() -> new IllegalArgumentException("UserBook не найден: " + dto.getUserBookId()));

        // Проверка, что пользователь не пытается обновить чужую запись
        if (!userBook.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("Нет доступа к этой записи");
        }

        if (dto.getProgress() != null)
            userBook.setProgress(dto.getProgress());
        if (dto.getCurrentPage() != null)
            userBook.setCurrentPage(dto.getCurrentPage());
        if (dto.getStatus() != null)
            userBook.setStatus(dto.getStatus());
        if (dto.getRating() != null)
            userBook.setRating(dto.getRating());

        return userBookRepository.save(userBook);
    }

    /**
     * Получить "мою" полку (полку текущего пользователя).
     */
    public Page<UserBook> getMyShelf(int page, int size, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        return userBookRepository.findByUser(currentUser, PageRequest.of(page, size));
    }

    /**
     * Удалить книгу с "моей" полки.
     */
    public void deleteMyUserBook(Long userBookId, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new IllegalArgumentException("UserBook не найден: " + userBookId));

        if (!userBook.getUser().getId().equals(currentUser.getId())) {
            throw new SecurityException("Нет доступа к этой записи");
        }

        userBookRepository.deleteById(userBookId);
    }
}
