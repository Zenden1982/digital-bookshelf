// src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UnifiedBookshelf from "../components/shelf/UnifiedBookshelf";
import { shelfService } from "../services/shelfService";
import "./Home.css";

const Home = () => {
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
        console.error("Ошибка загрузки полки:", err);
        setError("Не удалось загрузить библиотеку.");
      } finally {
        setLoading(false);
      }
    };

    fetchShelf();
  }, []);

  if (loading) {
    return (
      <div className="home-container loading">
        <h2>Загружаем вашу библиотеку...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1 className="home-title">Моя библиотека</h1>
          <p className="home-stats">Всего книг: {userBooks.length}</p>
        </div>

        <Link to="/import" className="add-book-btn">
          + Добавить книгу
        </Link>
      </header>

      <div className="library-section">
        <UnifiedBookshelf allBooks={userBooks} />
      </div>
    </div>
  );
};

export default Home;
