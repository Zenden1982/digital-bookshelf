package com.diplom.diplom.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long>, JpaSpecificationExecutor<UserBook> {

    Optional<UserBook> findByUserAndBook(User user, Book book);

    Page<UserBook> findByUserId(Long userId, Pageable pageable);

    Page<UserBook> findByUserUsername(String username, Pageable pageable);

    Optional<UserBook> findByUserIdAndBookId(Long userId, Long bookId);

    Page<UserBook> findByUser(User user, Pageable pageable);

    Page<UserBook> findByUserAndStatus(User user, String status, Pageable pageable);

    @Query("SELECT ub.book.id FROM UserBook ub WHERE ub.user.id = :userId AND ub.book.id IN :bookIds")
    Set<Long> findBookIdsByUser(Long userId, List<Long> bookIds);
}
