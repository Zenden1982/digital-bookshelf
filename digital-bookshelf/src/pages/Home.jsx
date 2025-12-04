// src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Bookshelf from "../components/shelf/Bookshelf";
import { useAuth } from "../context/AuthContext";
import { shelfService } from "../services/shelfService";

import AddIcon from "@mui/icons-material/Add";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";

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

  const readingBooks = userBooks.filter((b) => b.status === "READING");
  const plannedBooks = userBooks.filter((b) => b.status === "PLAN_TO_READ");
  const finishedBooks = userBooks.filter((b) => b.status === "FINISHED");

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
        <div className="loader">Загрузка библиотеки...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-title">Моя библиотека</h1>
          <div className="compact-stats">
            <span className="stat-item">
              {userBooks.length} {userBooks.length === 1 ? "книга" : "книг"}
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">
              {totalPages.toLocaleString()} страниц
            </span>
            <span className="stat-divider">•</span>
            <span className="stat-item">{avgProgress}% средний прогресс</span>
          </div>
        </div>
        <Link to="/import" className="add-book-btn">
          <AddIcon /> Добавить книгу
        </Link>
      </header>

      <div className="shelves-container">
        {readingBooks.length > 0 && (
          <section className="shelf-section reading">
            <div className="section-header">
              <div className="section-title">
                <MenuBookIcon className="section-icon" />
                <h2>Читаю сейчас</h2>
                <span className="book-count">{readingBooks.length}</span>
              </div>
            </div>
            <Bookshelf books={readingBooks} status="READING" />
          </section>
        )}

        {plannedBooks.length > 0 && (
          <section className="shelf-section planned">
            <div className="section-header">
              <div className="section-title">
                <PlaylistAddIcon className="section-icon" />
                <h2>В планах</h2>
                <span className="book-count">{plannedBooks.length}</span>
              </div>
            </div>
            <Bookshelf books={plannedBooks} status="PLAN_TO_READ" />
          </section>
        )}

        {finishedBooks.length > 0 && (
          <section className="shelf-section finished">
            <div className="section-header">
              <div className="section-title">
                <CheckCircleIcon className="section-icon" />
                <h2>Прочитано</h2>
                <span className="book-count">{finishedBooks.length}</span>
              </div>
            </div>
            <Bookshelf books={finishedBooks} status="FINISHED" />
          </section>
        )}

        {userBooks.length === 0 && (
          <div className="empty-library">
            <AutoStoriesIcon sx={{ fontSize: 64, color: "#BDBDBD" }} />
            <h3>Ваша библиотека пуста</h3>
            <p>Начните добавлять книги, чтобы отслеживать прогресс чтения</p>
            <Link to="/import" className="action-button">
              <AddIcon /> Найти книги
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
