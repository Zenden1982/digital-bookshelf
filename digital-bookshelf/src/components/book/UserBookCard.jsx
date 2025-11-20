// src/components/book/UserBookCard.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { shelfService } from "../../services/shelfService";
import TagManager from "./TagManager";

// Иконки
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import StarIcon from "@mui/icons-material/Star";

import "./UserBookCard.css";

// Карта статусов с улучшенными иконками
const statusMap = {
  READING: {
    label: "Читаю",
    icon: <MenuBookIcon />,
    color: "#27AE60",
  },
  PLAN_TO_READ: {
    label: "В планах",
    icon: <PlaylistAddIcon />,
    color: "#3498DB",
  },
  FINISHED: {
    label: "Прочитано",
    icon: <CheckCircleIcon />,
    color: "#95A5A6",
  },
  ABANDONED: {
    label: "Отложено",
    icon: <PauseCircleIcon />,
    color: "#F39C12",
  },
};

const UserBookCard = ({ userBook, onUpdate }) => {
  const navigate = useNavigate();
  const { book } = userBook;

  const [currentStatus, setCurrentStatus] = useState(userBook.status);
  const [currentTags, setCurrentTags] = useState(userBook.tags || []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const coverUrl =
    book.coverUrl || "https://via.placeholder.com/300x450.png?text=Нет+обложки";

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    setIsMenuOpen(false);
    try {
      await shelfService.updateMyUserBook(userBook.id, { status: newStatus });
      setCurrentStatus(newStatus);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Не удалось обновить статус книги:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsMenuOpen(false);
    if (
      window.confirm(
        `Вы уверены, что хотите удалить книгу "${book.title}" с полки?`
      )
    ) {
      setIsLoading(true);
      try {
        await shelfService.deleteMyUserBook(userBook.id);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Не удалось удалить книгу:", error);
        setIsLoading(false);
      }
    }
  };

  const handleCardClick = (e) => {
    // Не переходим, если клик был по меню или тегам
    if (
      e.target.closest(".card-menu-container") ||
      e.target.closest(".tag-manager") ||
      e.target.closest(".tags-container")
    ) {
      return;
    }
    navigate(`/book/${book.id}`);
  };

  // Закрытие меню при клике вне его
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="user-book-card" onClick={handleCardClick}>
      {/* Контейнер обложки с оверлеем */}
      <div className="book-card-cover-container">
        <img
          src={coverUrl}
          alt={`Обложка книги ${book.title}`}
          className="book-card-cover"
        />

        {/* Градиентный оверлей для читаемости бейджей */}
        <div className="cover-overlay"></div>

        {/* Плашка со статусом */}
        <div
          className="status-badge"
          style={{ backgroundColor: statusMap[currentStatus]?.color }}
        >
          {statusMap[currentStatus]?.icon}
          <span>{statusMap[currentStatus]?.label}</span>
        </div>

        {/* Рейтинг, если есть */}
        {userBook.rating && (
          <div className="rating-badge">
            <StarIcon />
            <span>{userBook.rating}</span>
          </div>
        )}

        {/* Прогресс чтения */}
        {userBook.progress > 0 && (
          <div className="progress-badge">{userBook.progress}%</div>
        )}
      </div>

      {/* Тело карточки */}
      <div className="book-card-body">
        <h3 className="book-card-title" title={book.title}>
          {book.title}
        </h3>
        <p className="book-card-author">{book.author}</p>

        {/* Метаинформация */}
        {book.pageCount && (
          <p className="book-card-meta">{book.pageCount} стр.</p>
        )}

        {/* Прогресс бар (если читается) */}
        {currentStatus === "READING" && userBook.progress > 0 && (
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${userBook.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Теги */}
        <TagManager
          userBookId={userBook.id}
          initialTags={currentTags}
          onTagsUpdate={(updatedTags) => setCurrentTags(updatedTags)}
        />
      </div>

      {/* Меню действий */}
      <div className="card-menu-container">
        <button
          className="menu-toggle"
          onClick={handleMenuToggle}
          aria-label="Открыть меню"
        >
          <MoreVertIcon />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="menu-backdrop"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
              }}
            />
            <div className="status-menu" onClick={(e) => e.stopPropagation()}>
              <div className="menu-header">
                <p>Изменить статус</p>
              </div>

              <div className="menu-options">
                {Object.entries(statusMap).map(
                  ([statusKey, { label, icon, color }]) => (
                    <button
                      key={statusKey}
                      className={`menu-option ${
                        currentStatus === statusKey ? "active" : ""
                      }`}
                      onClick={() => handleStatusChange(statusKey)}
                    >
                      <span className="menu-option-icon" style={{ color }}>
                        {icon}
                      </span>
                      <span>{label}</span>
                      {currentStatus === statusKey && (
                        <CheckCircleIcon className="check-icon" />
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="menu-divider"></div>

              <div className="menu-actions">
                <button
                  className="menu-action-button edit-button"
                  onClick={() => navigate(`/book/${book.id}`)}
                >
                  <EditIcon />
                  <span>Подробнее</span>
                </button>
                <button
                  className="menu-action-button delete-button"
                  onClick={handleDelete}
                >
                  <DeleteIcon />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Оверлей загрузки */}
      {isLoading && (
        <div className="card-loader">
          <div className="loader-spinner"></div>
          <span>Обновление...</span>
        </div>
      )}
    </div>
  );
};

export default UserBookCard;
