// src/pages/Home.jsx

import { useEffect, useState } from "react";
import Bookshelf from "../components/shelf/Bookshelf"; // Этот компонент мы создадим дальше
import { useAuth } from "../context/AuthContext";
import { shelfService } from "../services/shelfService";
import "./Home.css"; // Стили тоже создадим дальше

const Home = () => {
  const { user } = useAuth();

  // Состояния компонента
  const [userBooks, setUserBooks] = useState([]); // Массив книг пользователя
  const [loading, setLoading] = useState(true); // Флаг загрузки данных
  const [error, setError] = useState(""); // Сообщение об ошибке

  // useEffect для загрузки данных при монтировании компонента
  useEffect(() => {
    const fetchShelf = async () => {
      try {
        setLoading(true); // Начинаем загрузку
        // Вызываем наш сервис для получения книг с полки
        const shelfData = await shelfService.getMyShelf();
        // В shelfData у нас объект Page, книги лежат в поле "content"
        setUserBooks(shelfData.content || []);
      } catch (err) {
        setError(
          "Не удалось загрузить вашу библиотеку. Пожалуйста, попробуйте обновить страницу."
        );
        console.error("Ошибка на странице Home:", err);
      } finally {
        setLoading(false); // Завершаем загрузку в любом случае
      }
    };

    fetchShelf();
  }, []); // Пустой массив зависимостей означает, что эффект выполнится только один раз

  // --- Расчет статистики на основе полученных данных ---
  const bookCount = userBooks.length;
  // Считаем прочитанные книги (предполагаем, что статус 'READ' или 'Прочитано')
  const readCount = userBooks.filter((ub) => ub.status === "READ").length;

  const getLibraryLevel = () => {
    if (bookCount === 0) return "Время начать";
    if (bookCount <= 10) return "Начало коллекции";
    if (bookCount <= 30) return "Растущая полка";
    if (bookCount <= 60) return "Домашняя библиотека";
    if (bookCount <= 100) return "Впечатляющая коллекция";
    return "Настоящая библиотека";
  };

  // --- Условный рендеринг в зависимости от состояния ---

  // Если идет загрузка
  if (loading) {
    return (
      <div className="home-container">
        <div className="loader">Загрузка вашей библиотеки...</div>
      </div>
    );
  }

  // Если произошла ошибка
  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // --- Основной рендер страницы ---
  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">Живая цифровая библиотека</h1>
        <p className="home-subtitle">Добро пожаловать, {user.username}!</p>
      </header>

      {/* Секция со статистикой */}
      <div className="library-stats">
        <div className="stat-card">
          <div className="stat-number">{bookCount}</div>
          <div className="stat-label">книг в коллекции</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{readCount}</div>
          <div className="stat-label">прочитано</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-level">{getLibraryLevel()}</div>
          <div className="stat-label">уровень библиотеки</div>
        </div>
      </div>

      {/* 
        Компонент "Живая полка".
        Мы передаем ему массив загруженных книг.
        Всю логику отрисовки полок и корешков он возьмет на себя.
      */}
      <Bookshelf books={userBooks} />
    </div>
  );
};

export default Home;
