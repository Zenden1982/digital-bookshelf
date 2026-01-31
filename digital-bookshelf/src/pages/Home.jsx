// src/pages/Home.jsx

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react"; // Добавили useCallback
import { Link, useNavigate } from "react-router-dom";
import BookCard from "../components/book/BookCard";
import Bookshelf from "../components/shelf/Bookshelf";
import "../components/shelf/Bookshelf.css";
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const [hoveredBook, setHoveredBook] = useState(null);

  useEffect(() => {
    const fetchShelf = async () => {
      try {
        setLoading(true);
        const shelfData = await shelfService.getMyShelf({ size: 1000 });
        setUserBooks(shelfData.content || []);
      } catch (err) {
        console.error("Ошибка загрузки полки:", err);
        setError("Не удалось загрузить библиотеку.");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        setLoadingRecs(true);
        const recData = await bookService.getHistoryRecommendations(0, 5);
        setRecommendations(recData.content || []);
      } catch (err) {
        console.error("Ошибка загрузки рекомендаций:", err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchShelf();
    fetchRecommendations();
  }, []);

  // --- ЛОГИКА DRAG & DROP ---
  const handleStatusChange = useCallback(
    async (bookId, newStatus) => {
      // 1. Сохраняем текущее состояние для отката
      const prevBooks = [...userBooks];

      // 2. Оптимистичное обновление UI
      setUserBooks((prev) =>
        prev.map((item) => {
          const currentId = item.id || item.book?.id;
          // Приводим к строке для надежного сравнения
          if (String(currentId) === String(bookId)) {
            return { ...item, status: newStatus };
          }
          return item;
        }),
      );

      // 3. Отправка на сервер
      try {
        // ИСПОЛЬЗУЕМ СУЩЕСТВУЮЩИЙ МЕТОД СЕРВИСА
        await shelfService.updateMyUserBook(bookId, { status: newStatus });
      } catch (err) {
        console.error("Ошибка при смене статуса:", err);
        // Откат изменений при ошибке
        setUserBooks(prevBooks);
        // Можно добавить красивый тост вместо alert
        alert("Не удалось переместить книгу. Попробуйте еще раз.");
      }
    },
    [userBooks],
  );

  const stats = {
    total: userBooks.length,
    reading: userBooks.filter((b) => b.status === "READING").length,
    planned: userBooks.filter((b) => b.status === "PLAN_TO_READ").length,
    finished: userBooks.filter((b) => b.status === "FINISHED").length,
    avgProgress:
      userBooks.filter((b) => b.status === "READING").length > 0
        ? Math.round(
            userBooks
              .filter((b) => b.status === "READING")
              .reduce((sum, b) => sum + (b.progress || 0), 0) /
              userBooks.filter((b) => b.status === "READING").length,
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="home-container loading">
        <div className="loader-spinner"></div>
        <h2>Загружаем вашу библиотеку...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container error">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-retry">
          Обновить
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-title">Моя библиотека</h1>

          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Всего книг</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">{stats.reading}</span>
              <span className="stat-label">Читаю</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">{stats.planned}</span>
              <span className="stat-label">В планах</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">{stats.finished}</span>
              <span className="stat-label">Прочитано</span>
            </div>
            {stats.reading > 0 && (
              <>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{stats.avgProgress}%</span>
                  <span className="stat-label">Ср. прогресс</span>
                </div>
              </>
            )}
          </div>
        </div>

        <Link to="/import" className="add-book-btn">
          Добавить книгу
        </Link>
      </header>

      <div className="library-section">
        <Bookshelf
          books={userBooks}
          onHoverChange={setHoveredBook}
          onStatusChange={handleStatusChange} // <-- Передаем обработчик
        />
      </div>

      {/* --- БЛОК РЕКОМЕНДАЦИЙ --- */}
      {!loadingRecs && recommendations.length > 0 && (
        <>
          <div className="section-divider">
            <span className="divider-icon">❦</span>
          </div>

          <section className="recommended-section">
            <div className="rec-header-wrapper">
              <div className="rec-titles">
                <h2 className="rec-title">Новые поступления</h2>
                <span className="rec-subtitle">
                  Подобрано специально для вашей коллекции
                </span>
              </div>
              <Link to="/recommendations" className="rec-link-all">
                В каталог →
              </Link>
            </div>

            <div className="rec-grid">
              {recommendations.map((item) => (
                <div
                  key={item.book.id}
                  className="rec-card-wrapper"
                  onClick={() => navigate(`/book/${item.book.id}`)}
                >
                  <BookCard book={item.book} isAdded={false} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <AnimatePresence>
        {hoveredBook && (
          <motion.div
            className="fixed-book-panel"
            initial={{ y: 50, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 50, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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

export default Home;
