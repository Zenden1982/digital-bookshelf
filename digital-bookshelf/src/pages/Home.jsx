import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Bookshelf from "../components/shelf/Bookshelf";
import "../components/shelf/Bookshelf.css";
import { shelfService } from "../services/shelfService";
import "./Home.css";

const Home = () => {
  const [userBooks, setUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

    fetchShelf();
  }, []);

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
              userBooks.filter((b) => b.status === "READING").length
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

          {/* <Link to="/import" className="add-book-btn">
            Импортировать книгу
          </Link> */}
        </div>
      </header>

      <div className="library-section">
        <Bookshelf books={userBooks} onHoverChange={setHoveredBook} />
      </div>

      <AnimatePresence>
        {hoveredBook && (
          <motion.div
            className="fixed-book-panel"
            initial={{ y: 100, opacity: 0, translateX: "-50%" }}
            animate={{ y: 0, opacity: 1, translateX: "-50%" }}
            exit={{ y: 100, opacity: 0, translateX: "-50%" }}
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
