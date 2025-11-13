import { useEffect, useState } from "react";
import "./Home.css";

const Home = () => {
  const [bookCount, setBookCount] = useState(12);
  const [hoveredBook, setHoveredBook] = useState(null);

  // Генерация случайных книг для демонстрации
  const generateBooks = (count) => {
    const colors = [
      "#8B1A1A",
      "#2C5530",
      "#1A3A5C",
      "#5C3A1A",
      "#4A2C5C",
      "#5C5C1A",
    ];
    const titles = [
      "Мастер и Маргарита",
      "Преступление и наказание",
      "Война и мир",
      "Анна Каренина",
      "Евгений Онегин",
      "Идиот",
      "Братья Карамазовы",
      "Доктор Живаго",
      "Тихий Дон",
      "Капитанская дочка",
      "Отцы и дети",
      "Обломов",
      "Мёртвые души",
      "Герой нашего времени",
      "1984",
      "Граф Монте-Кристо",
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: titles[i % titles.length],
      color: colors[i % colors.length],
      width: Math.floor(Math.random() * 20) + 25,
      height: Math.floor(Math.random() * 30) + 190,
      progress: Math.floor(Math.random() * 100),
    }));
  };

  const [books, setBooks] = useState(generateBooks(bookCount));

  useEffect(() => {
    setBooks(generateBooks(bookCount));
  }, [bookCount]);

  // Определение количества полок в зависимости от количества книг
  const getShelfCount = () => {
    if (bookCount <= 10) return 1;
    if (bookCount <= 30) return 2;
    if (bookCount <= 60) return 3;
    if (bookCount <= 100) return 4;
    return 5;
  };

  // Распределение книг по полкам
  const distributeBooks = () => {
    const shelfCount = getShelfCount();
    const booksPerShelf = Math.ceil(books.length / shelfCount);
    const shelves = [];

    for (let i = 0; i < shelfCount; i++) {
      shelves.push(books.slice(i * booksPerShelf, (i + 1) * booksPerShelf));
    }

    return shelves;
  };

  const shelves = distributeBooks();

  // Определение уровня библиотеки
  const getLibraryLevel = () => {
    if (bookCount <= 10) return "Начало коллекции";
    if (bookCount <= 30) return "Растущая полка";
    if (bookCount <= 60) return "Домашняя библиотека";
    if (bookCount <= 100) return "Впечатляющая коллекция";
    return "Настоящая библиотека";
  };

  return (
    <div className="home-container">
      {/* Заголовок */}
      <header className="home-header">
        <h1 className="home-title">Живая цифровая библиотека</h1>
        <p className="home-subtitle">Ваше личное пространство для чтения</p>
      </header>

      {/* Статистика */}
      <div className="library-stats">
        <div className="stat-card">
          <div className="stat-number">{bookCount}</div>
          <div className="stat-label">книг в коллекции</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{Math.floor(bookCount * 0.3)}</div>
          <div className="stat-label">прочитано</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-level">{getLibraryLevel()}</div>
          <div className="stat-label">уровень библиотеки</div>
        </div>
      </div>

      {/* Живая полка */}
      <div className="library-container">
        <div className="library-growth-indicator">
          <div className="growth-bar">
            <div
              className="growth-progress"
              style={{ width: `${Math.min((bookCount / 100) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="growth-text">
            {bookCount < 100
              ? `Ещё ${100 - bookCount} книг до следующего уровня`
              : "Вы достигли максимального уровня!"}
          </div>
        </div>

        <div className="bookshelf-wrapper">
          {shelves.map((shelfBooks, shelfIndex) => (
            <div key={shelfIndex} className="bookshelf">
              <div className="books-row">
                {shelfBooks.map((book) => (
                  <div
                    key={book.id}
                    className={`book-spine ${
                      hoveredBook === book.id ? "hovered" : ""
                    }`}
                    style={{
                      backgroundColor: book.color,
                      width: `${book.width}px`,
                      height: `${book.height}px`,
                    }}
                    onMouseEnter={() => setHoveredBook(book.id)}
                    onMouseLeave={() => setHoveredBook(null)}
                  >
                    <div className="book-title">{book.title}</div>
                    <div
                      className="book-progress-indicator"
                      style={{ height: `${book.progress}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="shelf-board"></div>
            </div>
          ))}
        </div>

        {/* Подсказка для взаимодействия */}
        {hoveredBook !== null && (
          <div className="book-tooltip">Нажмите, чтобы открыть книгу</div>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="quick-actions">
        <button className="action-button primary">
          <span className="button-icon">+</span>
          Добавить книгу
        </button>
        <button className="action-button secondary">
          <span className="button-icon">📚</span>
          Каталог
        </button>
        <button className="action-button secondary">
          <span className="button-icon">🔍</span>
          Поиск
        </button>
        <button className="action-button secondary">
          <span className="button-icon">📊</span>
          Аналитика
        </button>
      </div>

      {/* Демо контроль (убрать в продакшене) */}
      <div className="demo-controls">
        <h3>Демо контроль</h3>
        <div className="control-group">
          <label>Количество книг: {bookCount}</label>
          <input
            type="range"
            min="1"
            max="120"
            value={bookCount}
            onChange={(e) => setBookCount(parseInt(e.target.value))}
          />
        </div>
        <p className="demo-note">
          Перемещайте ползунок, чтобы увидеть, как растёт библиотека
        </p>
      </div>
    </div>
  );
};

export default Home;
