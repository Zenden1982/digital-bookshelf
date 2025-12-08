// src/components/shelf/Bookshelf.jsx

import { motion } from "framer-motion";
import BookSpine from "./BookSpine";
import "./Bookshelf.css";

const BOOKS_PER_ROW = 14;

const booksContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
};

const shelfContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.3,
    },
  },
};

const shelfRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const chunkBooks = (books, size) => {
  if (!books) return [];
  const chunks = [];
  for (let i = 0; i < books.length; i += size) {
    chunks.push(books.slice(i, i + size));
  }
  return chunks;
};

const ShelfRow = ({ title, books, onHoverBook, onLeaveBook, isFirstRow }) => {
  if (!books || books.length === 0) return null;

  return (
    <motion.div className="shelf-tier" variants={shelfRowVariants}>
      {isFirstRow && title && (
        <div className="shelf-label">
          <span className="label-text">{title}</span>
          <span className="label-count">{books.length}</span>
        </div>
      )}

      <motion.div
        className="books-container"
        variants={booksContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {books.map((book) => (
          <BookSpine
            key={book.id || book.book?.id}
            book={book}
            onHover={onHoverBook}
            onLeave={onLeaveBook}
          />
        ))}
      </motion.div>

      <div className="wooden-board">
        <div className="board-shadow" />
      </div>
    </motion.div>
  );
};

const Bookshelf = ({ books = [], onHoverChange }) => {
  const reading = books.filter((b) => b.status === "READING");
  const planned = books.filter((b) => b.status === "PLAN_TO_READ");
  const finished = books.filter((b) => b.status === "FINISHED");

  const readingRows = chunkBooks(reading, BOOKS_PER_ROW);
  const plannedRows = chunkBooks(planned, BOOKS_PER_ROW);
  const finishedRows = chunkBooks(finished, BOOKS_PER_ROW);

  const handleHover = (book) => {
    if (onHoverChange) onHoverChange(book);
  };

  const handleLeave = () => {
    if (onHoverChange) onHoverChange(null);
  };

  if (!books || books.length === 0) {
    return (
      <div className="bookshelf-wrapper">
        <div className="empty-shelf-message">Полка пуста...</div>
      </div>
    );
  }

  return (
    <div className="bookshelf-wrapper arch-library">
      <div className="cabinet-frame">
        <div className="cabinet-top">
          <div className="cornice-detail" />
        </div>

        <div className="cabinet-body">
          <div className="cabinet-side left" />
          <div className="cabinet-side right" />

          <motion.div
            className="cabinet-content"
            variants={shelfContentVariants}
            initial="hidden"
            animate="visible"
          >
            {readingRows.map((chunk, i) => (
              <ShelfRow
                key={`reading-${i}`}
                title="Читаю сейчас"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}

            {plannedRows.map((chunk, i) => (
              <ShelfRow
                key={`planned-${i}`}
                title="В планах"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}

            {finishedRows.map((chunk, i) => (
              <ShelfRow
                key={`finished-${i}`}
                title="Прочитано"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}
          </motion.div>
        </div>

        <div className="cabinet-base">
          <div className="base-detail" />
        </div>
      </div>
    </div>
  );
};

export default Bookshelf;
