// src/components/shelf/UnifiedBookshelf.jsx

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import BookSpine from "./BookSpine";
import "./Bookshelf.css";

const BOOKS_PER_ROW = 20;

const processBooksWithTags = (books) => {
  if (!books || books.length === 0) return [];

  const groups = {};
  const noTag = [];

  books.forEach((book) => {
    const tags = book.tags;

    if (tags && tags.length > 0) {
      const rawTag = tags[0];
      const primaryTag =
        typeof rawTag === "string" ? rawTag : rawTag.name || "";

      if (!primaryTag) {
        noTag.push(book);
        return;
      }

      if (!groups[primaryTag]) {
        groups[primaryTag] = [];
      }
      groups[primaryTag].push(book);
    } else {
      noTag.push(book);
    }
  });

  const result = [];

  Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .forEach((tagName) => {
      result.push({
        _type: "DIVIDER",
        id: `div-${tagName}`,
        label: tagName,
      });
      result.push(...groups[tagName]);
    });

  if (noTag.length > 0) {
    result.push({
      _type: "DIVIDER",
      id: "div-no-tag",
      label: "Без тега",
    });
    result.push(...noTag);
  }

  return result;
};

const chunkItems = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
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
        {books.map((item) =>
          item._type === "DIVIDER" ? (
            <div key={item.id} className="shelf-tag-separator">
              <span className="shelf-tag-label">{item.label}</span>
            </div>
          ) : (
            <BookSpine
              key={item.id || item.book?.id}
              book={item}
              onHover={onHoverBook}
              onLeave={onLeaveBook}
            />
          )
        )}
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

  const readingItems = processBooksWithTags(reading);
  const plannedItems = processBooksWithTags(planned);
  const finishedItems = processBooksWithTags(finished);

  const readingRows = chunkItems(readingItems, BOOKS_PER_ROW);
  const plannedRows = chunkItems(plannedItems, BOOKS_PER_ROW);
  const finishedRows = chunkItems(finishedItems, BOOKS_PER_ROW);

  const handleHover = (book) => setHoveredBook(book);
  const handleLeave = () => setHoveredBook(null);

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
                onLeaveBook={handleLeave}
              />
            ))}

            {plannedRows.map((chunk, index) => (
              <ShelfRow
                key={`planned-${index}`}
                title="В планах"
                isFirstRow={index === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}

            {finishedRows.map((chunk, index) => (
              <ShelfRow
                key={`finished-${index}`}
                title="Прочитано"
                isFirstRow={index === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
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
