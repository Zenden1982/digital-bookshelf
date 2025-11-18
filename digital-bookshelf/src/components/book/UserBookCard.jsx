// src/components/book/UserBookCard.jsx

import { useState } from "react";
import { shelfService } from "../../services/shelfService";
import TagManager from "./TagManager"; // Компонент для управления тегами

// Иконки
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MoreVertIcon from "@mui/icons-material/MoreVert"; // Иконка "троеточие" для меню
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";

import "./UserBookCard.css"; // Стили для этой карточки

// Карта статусов для удобного отображения
const statusMap = {
  READING: { label: "Читаю", icon: <MenuBookIcon /> },
  PLAN_TO_READ: { label: "В планах", icon: <PlaylistAddIcon /> },
  FINISHED: { label: "Прочитано", icon: <CheckCircleIcon /> },
};

const UserBookCard = ({ userBook, onUpdate }) => {
  // Деструктурируем book из userBook для удобства
  const { book } = userBook;

  // Локальные состояния для немедленного отклика интерфейса
  const [currentStatus, setCurrentStatus] = useState(userBook.status);
  const [currentTags, setCurrentTags] = useState(userBook.tags);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // URL обложки с запасным вариантом
  const coverUrl =
    book.coverUrl || "https://via.placeholder.com/150x220.png?text=Нет+обложки";

  // Обработчик смены статуса книги
  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    setIsMenuOpen(false);
    try {
      await shelfService.updateMyUserBook(userBook.id, { status: newStatus });
      setCurrentStatus(newStatus); // Обновляем статус локально для UI
      if (onUpdate) onUpdate(); // Уведомляем родительский компонент, чтобы он мог перезагрузить список
    } catch (error) {
      console.error("Не удалось обновить статус книги:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик удаления книги с полки
  const handleDelete = async () => {
    setIsLoading(true);
    setIsMenuOpen(false);
    // Запрос подтверждения у пользователя
    if (
      window.confirm(
        `Вы уверены, что хотите удалить книгу "${book.title}" с полки?`
      )
    ) {
      try {
        await shelfService.deleteMyUserBook(userBook.id);
        if (onUpdate) onUpdate(); // Уведомляем родителя для обновления списка
      } catch (error) {
        console.error("Не удалось удалить книгу:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // Снимаем флаг загрузки, если пользователь отменил действие
    }
  };

  return (
    <div className="user-book-card">
      {/* Плашка с текущим статусом */}
      <div className="status-badge">
        {statusMap[currentStatus]?.icon}
        <span>{statusMap[currentStatus]?.label}</span>
      </div>

      {/* Обложка */}
      <img
        src={coverUrl}
        alt={`Обложка книги ${book.title}`}
        className="book-card-cover"
      />

      {/* Тело карточки с информацией и тегами */}
      <div className="book-card-body">
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>

        {/* Интегрированный компонент для управления тегами */}
        <TagManager
          userBookId={userBook.id}
          initialTags={currentTags}
          onTagsUpdate={(updatedTags) => setCurrentTags(updatedTags)}
        />
      </div>

      {/* Контейнер для выпадающего меню */}
      <div className="card-menu-container">
        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MoreVertIcon />
        </button>
        {isMenuOpen && (
          <div className="status-menu">
            <p>Изменить статус:</p>
            {Object.entries(statusMap).map(([statusKey, { label }]) => (
              <button
                key={statusKey}
                onClick={() => handleStatusChange(statusKey)}
              >
                {label}
              </button>
            ))}
            <div className="menu-divider"></div>
            <button className="delete-button" onClick={handleDelete}>
              <DeleteIcon /> Удалить с полки
            </button>
          </div>
        )}
      </div>

      {/* Оверлей загрузки */}
      {isLoading && <div className="card-loader">Обновление...</div>}
    </div>
  );
};

export default UserBookCard;
