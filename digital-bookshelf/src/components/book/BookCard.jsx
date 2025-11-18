// src/components/book/BookCard.jsx

import { useState } from "react";
import { shelfService } from "../../services/shelfService";

import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";

import "./BookCard.css";

const BookCard = ({ book, onImport, isActionDisabled = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [isAdded, setIsAdded] = useState(book.isAdded || false);
  const [showAddOptions, setShowAddOptions] = useState(false);

  const coverUrl =
    book.coverUrl ||
    "https://cm.author.today/content/2024/08/18/f9d8588e383046978f33294b139901cd.jpg";

  const handleAdd = async (status) => {
    setIsAdding(true);
    setError("");
    setShowAddOptions(false);

    try {
      if (onImport) {
        await onImport(status);
      } else {
        await shelfService.addBookToMyShelf({
          bookId: book.id,
          status: status,
        });
      }
      setIsAdded(true);
    } catch (err) {
      const isConflict = err.response?.status === 409;
      const errorMessage =
        err.response?.data?.message || "Произошла неизвестная ошибка.";

      if (isConflict) {
        setError("Эта книга уже есть на вашей полке.");
        setIsAdded(true);
      } else {
        setError(errorMessage);
      }
      console.error("Ошибка на карточке:", err);
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
              <CheckCircleIcon /> На полке
            </div>
          ) : (
            <div className="add-to-shelf-container">
              <button
                className="add-button primary"
                onClick={() => setShowAddOptions(!showAddOptions)}
                // >>> ИЗМЕНЕНИЕ: Кнопка отключается, если isAdding или isActionDisabled
                disabled={isAdding || isActionDisabled}
              >
                {isAdding ? (
                  "Добавление..."
                ) : isActionDisabled ? (
                  "Нет ISBN" // >>> ИЗМЕНЕНИЕ: Новый текст для отключенной кнопки
                ) : (
                  <>
                    <AddIcon /> Добавить
                  </>
                )}
              </button>
              {showAddOptions && (
                <div className="add-options-menu">
                  <button onClick={() => handleAdd("PLAN_TO_READ")}>
                    <PlaylistAddIcon /> В планы
                  </button>
                  <button onClick={() => handleAdd("READING")}>
                    <MenuBookIcon /> Читаю
                  </button>
                  <button onClick={() => handleAdd("FINISHED")}>
                    <CheckCircleIcon /> Прочитано
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
