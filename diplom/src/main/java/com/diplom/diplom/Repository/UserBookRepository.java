package com.diplom.diplom.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long>, JpaSpecificationExecutor<UserBook> {

    List<UserBook> findByUser(User user);

    Page<UserBook> findByUser(User user, Pageable pageable);

    Optional<UserBook> findByUserAndBook(User user, Book book);

    boolean existsByUserAndBook(User user, Book book);

    // Старый метод (можно оставить, но мы будем использовать новый)
    @Query("SELECT ub.book.id FROM UserBook ub WHERE ub.user.id = :userId AND ub.book.id IN :bookIds")
    Set<Long> findBookIdsByUser(@Param("userId") Long userId, @Param("bookIds") List<Long> bookIds);

    // НОВЫЙ МЕТОД: Достаем ВСЕ id книг пользователя
    @Query("SELECT ub.book.id FROM UserBook ub WHERE ub.user.id = :userId")
    Set<Long> findAllBookIdsByUserId(@Param("userId") Long userId);
}
