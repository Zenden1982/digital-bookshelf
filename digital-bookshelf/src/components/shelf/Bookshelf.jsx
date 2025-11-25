// src/components/shelf/Bookshelf.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookshelf.css"; // Убедитесь, что путь правильный

const Bookshelf = ({ books = [] }) => {
  const navigate = useNavigate();
  const [hoveredBook, setHoveredBook] = useState(null);

  // Цветовая палитра для корешков
  const spineColors = [
    "#8B1A1A",
    "#2C5530",
    "#1A3A5C",
    "#5C3A1A",
    "#4A2C5C",
    "#5C5C1A",
    "#7A3B3B",
    "#3A5F5F",
  ];

  // 1. ИСПРАВЛЕНИЕ: Если книг нет, рисуем одну пустую полку, а не null
  // Или показываем сообщение
  if (!books || books.length === 0) {
    return (
      <div className="bookshelf-container">
        <div className="bookshelf-empty-message">
          <p>Ваша полка пока пуста</p>
          {/* Рисуем одну пустую доску для красоты */}
          <div className="bookshelf">
            <div className="books-row"></div>
            <div className="shelf-board"></div>
          </div>
        </div>
      </div>
    );
  }

  // Распределение книг по полкам
  const distributeBooks = () => {
    const shelfCount = Math.max(1, Math.ceil(books.length / 12));
    const booksPerShelf = Math.ceil(books.length / shelfCount);
    const shelves = [];

    for (let i = 0; i < shelfCount; i++) {
      shelves.push(books.slice(i * booksPerShelf, (i + 1) * booksPerShelf));
    }

    return shelves;
  };

  const shelves = distributeBooks();

  // Расчет ширины книги
  const getBookWidth = (pageCount) => {
    if (!pageCount) return 25;
    const minWidth = 20; // Чуть увеличил минимум
    const maxWidth = 50;
    const minPages = 100;
    const maxPages = 1000;

    const width =
      minWidth +
      ((pageCount - minPages) / (maxPages - minPages)) * (maxWidth - minWidth);
    return Math.max(minWidth, Math.min(maxWidth, width));
  };

  const getBookColor = (index) => {
    return spineColors[index % spineColors.length];
  };

  const handleBookClick = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="bookshelf-container">
      <div className="bookshelf-wrapper">
        {shelves.map((shelfBooks, shelfIndex) => (
          <div key={shelfIndex} className="bookshelf">
            <div className="books-row">
              {shelfBooks.map((userBook, bookIndex) => {
                const globalIndex =
                  shelfIndex * Math.ceil(books.length / shelves.length) +
                  bookIndex;

                // Проверка на наличие book внутри userBook
                const bookInfo = userBook.book || {};
                const width = getBookWidth(bookInfo.pageCount);
                const height = 140 + Math.random() * 20;

                return (
                  <div
                    key={userBook.id}
                    className={`book-spine ${
                      hoveredBook === userBook.id ? "hovered" : ""
                    }`}
                    style={{
                      backgroundColor: getBookColor(globalIndex),
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                    onClick={() => handleBookClick(bookInfo.id)}
                    onMouseEnter={() => setHoveredBook(userBook.id)}
                    onMouseLeave={() => setHoveredBook(null)}
                    title={`${bookInfo.title} - ${bookInfo.author}`}
                  >
                    {/* Индикатор прогресса */}
                    {userBook.progress > 0 && (
                      <div
                        className="book-progress-indicator"
                        style={{ height: `${userBook.progress}%` }}
                      />
                    )}

                    {/* Индикатор статуса */}
                    <div className="book-status-dot">
                      {userBook.status === "READING" && (
                        <span className="status-reading">●</span>
                      )}
                      {userBook.status === "FINISHED" && (
                        <span className="status-completed">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Доска полки */}
            <div className="shelf-board" />
          </div>
        ))}
      </div>

      {/* Подсказка */}
      {hoveredBook && (
        <div className="book-tooltip">
          {(() => {
            const item = books.find((b) => b.id === hoveredBook);
            const book = item?.book;
            return book ? (
              <>
                <strong>{book.title}</strong>
                <span>{book.author}</span>
                {item.progress > 0 && (
                  <span className="tooltip-progress">
                    {item.progress}% прочитано
                  </span>
                )}
              </>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
