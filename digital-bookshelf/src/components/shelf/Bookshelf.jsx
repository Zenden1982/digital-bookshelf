// src/components/shelf/Bookshelf.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookshelf.css";

const Bookshelf = ({ books, status }) => {
  const navigate = useNavigate();
  const [hoveredBook, setHoveredBook] = useState(null);

  if (!books || books.length === 0) {
    return null;
  }

  const getBookWidth = (pageCount) => {
    if (!pageCount) return 30;
    const minWidth = 20;
    const maxWidth = 50;
    const minPages = 100;
    const maxPages = 1000;

    const width =
      minWidth +
      ((pageCount - minPages) / (maxPages - minPages)) * (maxWidth - minWidth);
    return Math.max(minWidth, Math.min(maxWidth, width));
  };

  const spineColors = [
    "#8B1A1A",
    "#2C5530",
    "#1A3A5C",
    "#5C3A1A",
    "#4A2C5C",
    "#5C5C1A",
  ];

  const getBookColor = (index) => {
    return spineColors[index % spineColors.length];
  };

  const distributeBooks = () => {
    const booksPerShelf = 12;
    const shelfCount = Math.ceil(books.length / booksPerShelf);
    const shelves = [];

    for (let i = 0; i < shelfCount; i++) {
      shelves.push(books.slice(i * booksPerShelf, (i + 1) * booksPerShelf));
    }

    return shelves;
  };

  const shelves = distributeBooks();

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="bookshelf-container">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div key={shelfIndex} className="bookshelf">
          <div className="books-row">
            {shelfBooks.map((userBook, bookIndex) => {
              const globalIndex = shelfIndex * 12 + bookIndex;
              const width = getBookWidth(userBook.book?.pageCount);
              const color = getBookColor(globalIndex);
              
              // const color = userBook.book?.semanticColor || getBookColor(globalIndex);

              return (
                <div
                  key={userBook.id}
                  className="book-spine"
                  style={{
                    width: `${width}px`,
                    backgroundColor: color,
                  }}
                  onClick={() => handleBookClick(userBook.book.id)}
                  onMouseEnter={() => setHoveredBook(userBook.id)}
                  onMouseLeave={() => setHoveredBook(null)}
                >
                  {userBook.progress > 0 && status === "READING" && (
                    <div
                      className="book-progress"
                      style={{ height: `${userBook.progress}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="shelf-board" />
        </div>
      ))}

      {hoveredBook && (
        <div className="book-tooltip">
          {(() => {
            const book = books.find((b) => b.id === hoveredBook);
            return book ? (
              <div className="tooltip-content">
                <h4 className="tooltip-title">{book.book.title}</h4>
                <p className="tooltip-author">{book.book.author}</p>
                {book.book.pageCount && (
                  <p className="tooltip-pages">{book.book.pageCount} стр.</p>
                )}
                {book.progress > 0 && (
                  <div className="tooltip-progress-wrapper">
                    <div className="tooltip-progress-bar">
                      <div
                        className="tooltip-progress-fill"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <span className="tooltip-progress-text">
                      {book.progress}%
                    </span>
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
