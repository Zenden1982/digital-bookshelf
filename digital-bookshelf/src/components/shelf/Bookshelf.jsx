// src/components/shelf/Bookshelf.jsx

import { Link } from "react-router-dom";
import BookSpine from "./BookSpine"; // Этот компонент мы создадим на следующем шаге
import "./Bookshelf.css"; // А эти стили — через один шаг

const Bookshelf = ({ books }) => {
  // Если книг нет, показываем специальное сообщение
  if (!books || books.length === 0) {
    return (
      <div className="empty-shelf-container">
        <div className="empty-shelf-message">
          <h3>Ваша полка пока пуста</h3>
          <p>Начните добавлять книги, чтобы ваша библиотека ожила!</p>
          <Link to="/search?q=Толстой" className="action-button primary">
            + Найти и добавить книгу
          </Link>
        </div>
      </div>
    );
  }

  // --- Логика расчета и распределения полок ---

  // Определяем, сколько полок нужно, исходя из количества книг
  const getShelfCount = () => {
    const count = books.length;
    if (count <= 10) return 1;
    if (count <= 30) return 2;
    if (count <= 60) return 3;
    // Можно добавить больше уровней
    return 4;
  };

  // Распределяем книги по полкам
  const distributeBooks = () => {
    const shelfCount = getShelfCount();
    // Вычисляем, сколько книг должно быть на одной полке
    const booksPerShelf = Math.ceil(books.length / shelfCount);
    const shelves = [];

    for (let i = 0; i < shelfCount; i++) {
      // "Нарезаем" массив книг на части для каждой полки
      const shelfContent = books.slice(
        i * booksPerShelf,
        (i + 1) * booksPerShelf
      );
      if (shelfContent.length > 0) {
        shelves.push(shelfContent);
      }
    }
    return shelves;
  };

  const shelves = distributeBooks();

  // --- Рендеринг компонента ---
  return (
    <div className="library-container">
      <div className="bookshelf-wrapper">
        {/* Проходимся по массиву полок */}
        {shelves.map((shelfBooks, shelfIndex) => (
          <div key={shelfIndex} className="bookshelf">
            <div className="books-row">
              {/* А теперь проходимся по книгам на текущей полке */}
              {shelfBooks.map((userBook) => (
                // Для каждой книги рендерим ее "корешок"
                <BookSpine key={userBook.id} userBook={userBook} />
              ))}
            </div>
            {/* Это сама деревянная доска полки */}
            <div className="shelf-board"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookshelf;
