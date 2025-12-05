// src/components/shelf/UnifiedBookshelf.jsx

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import BookSpine from "./BookSpine";
import "./Bookshelf.css";

const BOOKS_PER_ROW = 14;

const chunkBooks = (books, size) => {
  const chunks = [];
  for (let i = 0; i < books.length; i += size) {
    chunks.push(books.slice(i, i + size));
  }
  return chunks;
};

const ShelfRow = ({ title, books, onHoverBook, onLeaveBook, isFirstRow }) => {
  if (!books || books.length === 0) return null;

  return (
    <div className="shelf-tier">
      {isFirstRow && title && (
        <div className="shelf-label">
          <span className="label-text">{title}</span>
        </div>
      )}

      <div className="books-container">
        {books.map((book) => (
          <BookSpine
            key={book.id || book.book?.id}
            book={book}
            onHover={onHoverBook}
            onLeave={onLeaveBook}
          />
        ))}
      </div>

      <div className="wooden-board">
        <div className="board-shadow" />
      </div>
    </div>
  );
};

const UnifiedBookshelf = ({ allBooks = [] }) => {
  const [hoveredBook, setHoveredBook] = useState(null);

  const reading = allBooks.filter((b) => b.status === "READING");
  const planned = allBooks.filter((b) => b.status === "PLAN_TO_READ");
  const finished = allBooks.filter((b) => b.status === "FINISHED");

  const readingRows = chunkBooks(reading, BOOKS_PER_ROW);
  const plannedRows = chunkBooks(planned, BOOKS_PER_ROW);
  const finishedRows = chunkBooks(finished, BOOKS_PER_ROW);

  const handleHover = (book) => setHoveredBook(book);

  return (
    <div className="bookshelf-wrapper arch-library">
      <div className="cabinet-frame">
        <div className="cabinet-top">
          <div className="cornice-detail" />
        </div>

        <div className="cabinet-body">
          <div className="cabinet-side left" />
          <div className="cabinet-side right" />

          <div className="cabinet-content">
            {readingRows.map((chunk, index) => (
              <ShelfRow
                key={`reading-${index}`}
                title="Читаю сейчас"
                isFirstRow={index === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={() => setHoveredBook(null)}
              />
            ))}

            {plannedRows.map((chunk, index) => (
              <ShelfRow
                key={`planned-${index}`}
                title="В планах"
                isFirstRow={index === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={() => setHoveredBook(null)}
              />
            ))}

            {finishedRows.map((chunk, index) => (
              <ShelfRow
                key={`finished-${index}`}
                title="Прочитано"
                isFirstRow={index === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={() => setHoveredBook(null)}
              />
            ))}

            {allBooks.length === 0 && (
              <div className="empty-shelf-message">
                Ваш шкаф пуст. Добавьте первую книгу!
              </div>
            )}
          </div>
        </div>

        <div className="cabinet-base">
          <div className="base-detail" />
        </div>
      </div>

      <AnimatePresence>
        {hoveredBook && (
          <motion.div
            className="fixed-book-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="panel-content">
              <div className="panel-info">
                <strong>{hoveredBook.book?.title || hoveredBook.title}</strong>
                <span>{hoveredBook.book?.author || hoveredBook.author}</span>
              </div>

              {hoveredBook.status === "READING" && (
                <div className="panel-progress">
                  <span className="progress-label">
                    Прогресс: {hoveredBook.progress}%
                  </span>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${hoveredBook.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {hoveredBook.status === "FINISHED" && (
                <div className="panel-badge finished">Прочитано</div>
              )}
              {hoveredBook.status === "PLAN_TO_READ" && (
                <div className="panel-badge planned">В планах</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnifiedBookshelf;
