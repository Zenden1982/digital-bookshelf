package com.diplom.diplom.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    // List<Book> findByTitle(String title);

    // List<Book> findByAuthor(String author);

    // void deleteById(Long id);

    // Book save(Book book);

    // Book findById(long id);

}
