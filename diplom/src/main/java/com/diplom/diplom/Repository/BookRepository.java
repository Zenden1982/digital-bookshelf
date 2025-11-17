package com.diplom.diplom.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    Optional<Book> findByGoogleBookId(String googleBookId);

    Optional<Book> findByTitleAndAuthor(String title, String author);

    @Query("SELECT b FROM Book b WHERE b.isbn = :query OR " +
            "LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Book> searchByTitleOrAuthorOrIsbn(@Param("query") String query);
}
