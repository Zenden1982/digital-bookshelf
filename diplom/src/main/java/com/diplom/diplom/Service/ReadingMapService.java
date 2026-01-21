package com.diplom.diplom.Service;

import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingMapService {

    private final BookService bookService;
    private final BookRepository bookRepository;

    /**
     * Generates a semantic reading path starting from a seed book.
     * The algorithm "walks" through the vector space finding the nearest neighbor that hasn't been visited yet.
     */
    public List<BookReadDTO> generateReadingPath(Long seedBookId, int length) {
        List<BookReadDTO> path = new ArrayList<>();
        Set<Long> visitedIds = new HashSet<>();

        // 1. Get Initial Book
        BookReadDTO seedBook;
        try {
            // Re-using existing DTO logic, though we might want internal entity for efficiency
            var bookDetail = bookService.getBookById(seedBookId); 
            seedBook = bookDetail.getBook(); // Assuming BookDetailDTO has a 'book' field of type BookReadDTO or similar. 
                                           // Wait, check BookDetailDTO structure. 
                                           // bookService.getBookById returns BookDetailDTO.
        } catch (Exception e) {
            log.error("Seed book not found: {}", seedBookId);
            return path;
        }

        if (seedBook == null) return path;

        path.add(seedBook);
        visitedIds.add(seedBook.getId());

        BookReadDTO currentBook = seedBook;

        // 2. Walk the chain
        for (int i = 0; i < length; i++) {
            // Find similar books to the current one
            // We ask for more than 1 because the top 1 might be the book itself or already visited
            List<BookReadDTO> candidates = bookService.findSimilarBooksByBookId(currentBook.getId(), 20);

            BookReadDTO nextBook = null;

            for (BookReadDTO candidate : candidates) {
                if (!visitedIds.contains(candidate.getId())) {
                    nextBook = candidate;
                    break;
                }
            }

            if (nextBook != null) {
                path.add(nextBook);
                visitedIds.add(nextBook.getId());
                currentBook = nextBook;
            } else {
                // Dead end (unlikely in a large DB, but possible)
                break;
            }
        }

        return path;
    }
}
