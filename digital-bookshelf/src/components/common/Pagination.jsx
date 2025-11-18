// src/components/common/Pagination.jsx

import "./Pagination.css"; // Стили создадим последним шагом

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Не показываем пагинацию, если страница всего одна
  if (totalPages <= 1) {
    return null;
  }

  // Создаем массив номеров страниц для отображения
  const pageNumbers = [];
  for (let i = 0; i < totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="pagination-container">
      <ul className="pagination-list">
        {/* Кнопка "Назад" */}
        <li
          className={`pagination-item ${currentPage === 0 ? "disabled" : ""}`}
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Назад
          </button>
        </li>

        {/* Номера страниц */}
        {pageNumbers.map((number) => (
          <li
            key={number}
            className={`pagination-item ${
              currentPage === number ? "active" : ""
            }`}
          >
            <button onClick={() => onPageChange(number)}>{number + 1}</button>
          </li>
        ))}

        {/* Кнопка "Вперед" */}
        <li
          className={`pagination-item ${
            currentPage === totalPages - 1 ? "disabled" : ""
          }`}
        >
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Вперед
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
