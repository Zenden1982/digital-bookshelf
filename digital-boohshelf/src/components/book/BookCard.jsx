// src/components/book/BookCard.jsx

import { useState } from "react";
import { bookService } from "../../services/bookService";
import { shelfService } from "../../services/shelfService";

// Иконки для кнопок
import AddIcon from "@mui/icons-material/Add";
import DoneIcon from "@mui/icons-material/Done";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";

import "./BookCard.css"; // Стили создадим на следующем шаге

const BookCard = ({ book, type }) => {
  // Локальные состояния для обработки добавления
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [isAdded, setIsAdded] = useState(book.isAdded || false); // Флаг, что книга уже на полке
  const [showAddOptions, setShowAddOptions] = useState(false);

  // Заглушка для обложки, если она отсутствует
  const coverUrl =
    book.coverUrl || "https://via.placeholder.com/150x220.png?text=Нет+обложки";

  /**
   * Основная функция добавления книги на полку.
   * @param {string} status - Статус, с которым книга добавляется ('PLAN_TO_READ', 'READING', 'READ').
   */
  const handleAdd = async (status) => {
    setIsAdding(true);
    setError("");
    setShowAddOptions(false); // Скрываем меню после выбора

    try {
      let localBookId = book.id;

      // ШАГ 1 (опционально): Если книга из Google, сначала сохраняем ее в нашу базу
      if (type === "google") {
        console.log(
          `Добавляем книгу из Google в локальную БД: ${book.googleBookId}`
        );
        const newLocalBook = await bookService.saveFromGoogle(
          book.googleBookId
        );
        localBookId = newLocalBook.id; // Получаем ее новый локальный ID
        console.log(`Книга сохранена с локальным ID: ${localBookId}`);
      }

      // ШАГ 2: Добавляем книгу на полку пользователя по ее локальному ID
      console.log(
        `Добавляем книгу ID ${localBookId} на полку со статусом ${status}`
      );
      await shelfService.addBookToMyShelf({
        bookId: localBookId,
        status: status,
      });

      setIsAdded(true); // Помечаем книгу как добавленную
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Не удалось добавить книгу.";
      setError(errorMessage);
      console.error("Ошибка при добавлении книги:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`book-card ${isAdded ? "added" : ""}`}>
      <img
        src={coverUrl}
        alt={`Обложка книги ${book.title}`}
        className="book-card-cover"
      />
      <div className="book-card-body">
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>

        <div className="book-card-actions">
          {isAdded ? (
            <div className="added-badge">
              <DoneIcon /> Добавлено на полку
            </div>
          ) : (
            <div className="add-to-shelf-container">
              <button
                className="add-button primary"
                onClick={() => setShowAddOptions(!showAddOptions)}
                disabled={isAdding}
              >
                {isAdding ? (
                  "Добавление..."
                ) : (
                  <>
                    <AddIcon /> Добавить
                  </>
                )}
              </button>
              {/* Выпадающее меню */}
              {showAddOptions && (
                <div className="add-options-menu">
                  <button onClick={() => handleAdd("PLAN_TO_READ")}>
                    <PlaylistAddIcon /> В планы
                  </button>
                  <button onClick={() => handleAdd("READING")}>
                    <MenuBookIcon /> Читаю
                  </button>
                  <button onClick={() => handleAdd("READ")}>
                    <DoneIcon /> Прочитано
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="card-error-message">{error}</p>}
      </div>
    </div>
  );
};

export default BookCard;
