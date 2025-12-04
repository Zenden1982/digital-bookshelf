// src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Bookshelf from "../components/shelf/Bookshelf";
import { useAuth } from "../context/AuthContext";
import { shelfService } from "../services/shelfService";

import AddIcon from "@mui/icons-material/Add";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

import "./Home.css";

const Home = () => {
  const { user } = useAuth();

  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShelf = async () => {
      try {
        setLoading(true);
        const shelfData = await shelfService.getMyShelf({ size: 1000 });
        setUserBooks(shelfData.content || []);
      } catch (err) {
        setError(
          "Не удалось загрузить вашу библиотеку. Пожалуйста, попробуйте обновить страницу."
        );
        console.error("Ошибка на странице Home:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShelf();
  }, []);

  // Группируем книги по статусам
  const groupedBooks = {
    READING: userBooks.filter((b) => b.status === "READING"),
    PLAN_TO_READ: userBooks.filter((b) => b.status === "PLAN_TO_READ"),
    FINISHED: userBooks.filter((b) => b.status === "FINISHED"),
    ABANDONED: userBooks.filter((b) => b.status === "ABANDONED"),
  };

  const totalPages = userBooks.reduce(
    (sum, b) => sum + (b.book?.pageCount || 0),
    0
  );
  const avgProgress =
    userBooks.length > 0
      ? Math.round(
          userBooks.reduce((sum, b) => sum + (b.progress || 0), 0) /
            userBooks.length
        )
      : 0;

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-loading">
          <div className="loader-spinner"></div>
          <p>Загрузка библиотеки...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="home-error">
          <p className="error-message">{error}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-title">Моя библиотека</h1>
          <div className="compact-stats">
            <span className="stat-item">
              <strong>{userBooks.length}</strong>{" "}
              {userBooks.length === 1 ? "книга" : "книг"}
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">
              <strong>{totalPages.toLocaleString()}</strong> страниц
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">
              <strong>{avgProgress}%</strong> средний прогресс
            </span>
          </div>
        </div>
        <Link to="/import" className="add-book-btn">
          <AddIcon />
          <span>Добавить книгу</span>
        </Link>
      </header>

      {/* Единая полка со всеми книгами */}
      {userBooks.length > 0 ? (
        <div className="unified-bookshelf">
          <Bookshelf books={userBooks} grouped={groupedBooks} />
        </div>
      ) : (
        <div className="empty-library">
          <AutoStoriesIcon style={{ fontSize: 64, color: "#BDBDBD" }} />
          <h3>Ваша библиотека пуста</h3>
          <p>Начните добавлять книги, чтобы отслеживать прогресс чтения</p>
          <Link to="/import" className="action-button">
            <AddIcon />
            <span>Найти книги</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
