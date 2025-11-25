// src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Bookshelf from "../components/shelf/Bookshelf";
import { useAuth } from "../context/AuthContext";
import { shelfService } from "../services/shelfService";

// Иконки
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import "./Home.css";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    reading: 0,
    completed: 0,
    planned: 0,
    totalPages: 0,
    avgProgress: 0,
  });

  useEffect(() => {
    const fetchShelf = async () => {
      try {
        setLoading(true);
        const shelfData = await shelfService.getMyShelf({ size: 1000 });
        const books = shelfData.content || [];
        setUserBooks(books);

        // Рассчитываем статистику
        const completed = books.filter((b) => b.status === "FINISHED").length;
        const reading = books.filter((b) => b.status === "READING").length;
        const planned = books.filter((b) => b.status === "PLAN_TO_READ").length;

        const totalPages = books.reduce((sum, b) => {
          return sum + (b.book?.pageCount || 0);
        }, 0);

        const avgProgress =
          books.length > 0
            ? books.reduce((sum, b) => sum + (b.progress || 0), 0) /
              books.length
            : 0;

        setStats({
          total: books.length,
          reading,
          completed,
          planned,
          totalPages,
          avgProgress: Math.round(avgProgress),
        });
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

  const getLibraryLevel = () => {
    const count = stats.total;
    if (count === 0) return "Время начать";
    if (count <= 10) return "Начало коллекции";
    if (count <= 30) return "Растущая полка";
    if (count <= 60) return "Домашняя библиотека";
    if (count <= 100) return "Впечатляющая коллекция";
    return "Настоящая библиотека";
  };

  const getProgressToNext = () => {
    const count = stats.total;
    if (count < 10)
      return { current: count, next: 10, percent: (count / 10) * 100 };
    if (count < 30)
      return { current: count, next: 30, percent: ((count - 10) / 20) * 100 };
    if (count < 60)
      return { current: count, next: 60, percent: ((count - 30) / 30) * 100 };
    if (count < 100)
      return { current: count, next: 100, percent: ((count - 60) / 40) * 100 };
    return { current: count, next: count, percent: 100 };
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-loading">
          <div className="loader-spinner"></div>
          <p>Загрузка вашей библиотеки...</p>
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

  const progress = getProgressToNext();

  return (
    <div className="home-container">
      {/* Header с приветствием */}
      <header className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Добро пожаловать,{" "}
            <span className="hero-name">{user?.username}</span>!
          </h1>
          <p className="hero-subtitle">Ваша личная цифровая библиотека</p>
        </div>
      </header>

      {/* Статистика */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <MenuBookIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Всего книг</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <AutoStoriesIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.reading}</div>
              <div className="stat-label">Читаю сейчас</div>
            </div>
          </div>

          <div className="stat-card completed">
            <div className="stat-icon">
              <TrendingUpIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Прочитано</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <AssessmentIcon />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.avgProgress}%</div>
              <div className="stat-label">Средний прогресс</div>
            </div>
          </div>
        </div>
      </section>

      {/* Уровень библиотеки */}
      <section className="level-section">
        <div className="level-card">
          <div className="level-header">
            <h3 className="level-title">{getLibraryLevel()}</h3>
            <span className="level-badge">
              Уровень {Math.min(Math.floor(stats.total / 10) + 1, 11)}
            </span>
          </div>

          {stats.total < 100 && (
            <>
              <div className="level-progress-bar">
                <div
                  className="level-progress-fill"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="level-text">
                Ещё {progress.next - progress.current}{" "}
                {progress.next - progress.current === 1 ? "книга" : "книг"} до
                следующего уровня
              </p>
            </>
          )}

          {stats.total >= 100 && (
            <p className="level-text max-level">
              🎉 Вы достигли максимального уровня!
            </p>
          )}
        </div>
      </section>

      {/* Быстрые действия */}
      <section className="quick-actions-section">
        <div className="quick-actions">
          <Link to="/search" className="action-card">
            <div className="action-icon">
              <AddIcon />
            </div>
            <h3>Добавить книгу</h3>
            <p>Найти и добавить новую книгу в коллекцию</p>
          </Link>

          <Link to="/catalog" className="action-card">
            <div className="action-icon">
              <MenuBookIcon />
            </div>
            <h3>Каталог</h3>
            <p>Просмотреть все книги в библиотеке</p>
          </Link>

          <Link to="/search?mode=semantic" className="action-card">
            <div className="action-icon">
              <SearchIcon />
            </div>
            <h3>Умный поиск</h3>
            <p>Найти книги по смыслу и настроению</p>
          </Link>
        </div>
      </section>

      {/* Живая полка */}
      {userBooks.length > 0 ? (
        <section className="bookshelf-section">
          <div className="section-header">
            <h2 className="section-title">Ваша библиотека</h2>
            <p className="section-subtitle">
              {stats.totalPages > 0 &&
                `${stats.totalPages.toLocaleString()} страниц в коллекции`}
            </p>
          </div>
          <Bookshelf books={userBooks} />
        </section>
      ) : (
        <section className="empty-library">
          <div className="empty-content">
            <MenuBookIcon style={{ fontSize: 80, opacity: 0.3 }} />
            <h2>Ваша библиотека пуста</h2>
            <p>Начните добавлять книги, чтобы они появились здесь</p>
            <Link to="/search" className="btn-primary">
              <AddIcon />
              <span>Добавить первую книгу</span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
