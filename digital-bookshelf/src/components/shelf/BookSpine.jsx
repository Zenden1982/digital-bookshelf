// src/components/shelf/BookSpine.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookshelf.css"; // Используем тот же файл стилей, что и для полки

const BookSpine = ({ userBook }) => {
  const navigate = useNavigate();

  // useMemo используется для оптимизации: стиль корешка вычисляется только один раз
  // для каждой книги и не пересчитывается при каждом рендере.
  const spineStyle = useMemo(() => {
    // Цвета корешков из вашей дизайн-системы
    const colors = [
      "#8B1A1A",
      "#2C5530",
      "#1A3A5C",
      "#5C3A1A",
      "#4A2C5C",
      "#5C5C1A",
    ];

    // Генерируем "случайные", но предсказуемые размеры
    const randomWidth = (userBook.book.id % 15) + 25; // Ширина от 25px до 40px
    const randomHeight = (userBook.book.id % 30) + 190; // Высота от 190px до 220px

    // Выбираем цвет на основе ID книги. Это гарантирует, что у книги всегда будет один и тот же цвет.
    const color = colors[userBook.book.id % colors.length];

    return {
      backgroundColor: color,
      width: `${randomWidth}px`,
      height: `${randomHeight}px`,
    };
  }, [userBook.book.id]); // Зависимость от ID книги

  // Обработчик клика по книге
  const handleBookClick = () => {
    // Перенаправляем на детальную страницу книги (этот маршрут мы создадим позже)
    navigate(`/books/${userBook.book.id}`);
  };

  // Получаем прогресс чтения
  const progress = userBook.progress || 0;

  return (
    <div
      className="book-spine"
      style={spineStyle}
      onClick={handleBookClick}
      // Всплывающая подсказка при наведении
      title={`${userBook.book.title} - ${userBook.book.author}`}
    >
      <div className="book-title-wrapper">
        <span className="book-title">{userBook.book.title}</span>
      </div>

      {/* Условный рендеринг индикатора прогресса */}
      {userBook.status === "READING" && progress > 0 && (
        <div
          className="book-progress-indicator"
          style={{ height: `${progress}%` }}
        ></div>
      )}
    </div>
  );
};

export default BookSpine;
