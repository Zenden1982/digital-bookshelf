package com.diplom.diplom.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.DTO.UserBookCreateDTO;
import com.diplom.diplom.Entity.DTO.UserBookReadDTO;
import com.diplom.diplom.Entity.DTO.UserBookUpdateDTO;
import com.diplom.diplom.Entity.DTO.UserReadDTO;
import com.diplom.diplom.Repository.BookRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.transaction.Transactional;
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
    public UserBookReadDTO addBookToMyShelf(UserBookCreateDTO dto, String currentUsername) {
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

        return map(userBookRepository.save(userBook));
    }

    /**
     * Обновить состояние книги на полке ТЕКУЩЕГО пользователя.
     */
    public UserBookReadDTO updateMyUserBook(UserBookUpdateDTO dto, String currentUsername) {
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

        return map(userBookRepository.save(userBook));
    }

    /**
     * Получить "мою" полку (полку текущего пользователя).
     */
    @Transactional
    public Page<UserBookReadDTO> getMyShelf(int page, int size, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        return userBookRepository.findByUser(currentUser, PageRequest.of(page, size))
                .map(this::map);
    }

    public UserBookReadDTO map(UserBook userBook) {
        return UserBookReadDTO.builder()
                .id(userBook.getId())
                .book(BookReadDTO.toDTO(userBook.getBook()))
                .user(UserReadDTO.toDTO(userBook.getUser()))
                .progress(userBook.getProgress())
                .currentPage(userBook.getCurrentPage())
                .status(userBook.getStatus())
                .rating(userBook.getRating())
                .build();
    }

    /**
     * Удалить книгу с "моей" полки.
     */
    @Transactional
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

    @Transactional
    public Page<UserBookReadDTO> getMyShelfByStatus(int page, int size, String currentUsername, String status) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден: " + currentUsername));
        return userBookRepository.findByUserAndStatus(currentUser, status, PageRequest.of(page, size))
                .map(this::map);
    }
}
