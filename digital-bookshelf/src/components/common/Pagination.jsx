// src/components/common/Pagination.jsx

import "./Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  for (let i = 0; i < totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="pagination-container">
      <ul className="pagination-list">
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
