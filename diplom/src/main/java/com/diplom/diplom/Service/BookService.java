package com.diplom.diplom.Service;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.DTO.BookCreateUpdateDTO;
import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Repository.BookRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    @Transactional
    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    @Transactional
    public BookReadDTO addBook(BookCreateUpdateDTO bookCreateUpdateDTO) {
        return BookReadDTO.toDTO(bookRepository.save(BookCreateUpdateDTO.toBook(bookCreateUpdateDTO)));
    }

    @Transactional
    public Page<BookReadDTO> getAllBooks(int page, int size) {
        return bookRepository.findAll(PageRequest.of(page, size)).map(BookReadDTO::toDTO);
    }
}
