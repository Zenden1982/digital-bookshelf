// src/pages/MyCatalog.jsx

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookCard from "../components/book/BookCard";
import Pagination from "../components/common/Pagination";
import { shelfService } from "../services/shelfService";
import "./MyCatalog.css";

// Опции статусов
const STATUS_OPTIONS = [
  { value: "FINISHED", label: "Прочитано" },
  { value: "READING", label: "Читаю" },
  { value: "PLAN_TO_READ", label: "В планах" },
];

// Опции сортировки: поле + направление
const SORT_OPTIONS = [
  { sort: "addedAt", direction: "DESC", label: "По дате добавления (новые)" },
  { sort: "addedAt", direction: "ASC", label: "По дате добавления (старые)" },
  { sort: "book.title", direction: "ASC", label: "По названию (А-Я)" },
  { sort: "book.author", direction: "ASC", label: "По автору (А-Я)" },
  { sort: "rating", direction: "DESC", label: "По рейтингу (убывание)" },
];

const MyCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Читаем значения из URL или берём дефолты
  const defaultSort = searchParams.get("sort") || SORT_OPTIONS[0].sort;
  const defaultDirection =
    searchParams.get("direction") || SORT_OPTIONS[0].direction;

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    status: searchParams.getAll("status") || [],
    sort: defaultSort, // например "addedAt"
    direction: defaultDirection, // "DESC"
    page: parseInt(searchParams.get("page") || "0", 10),
  });

  const [userBooks, setUserBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Обновляем URL при изменении фильтров
  const updateUrlParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();

      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.sort) params.set("sort", newFilters.sort);
      if (newFilters.direction) params.set("direction", newFilters.direction);

      // Страницу лучше всегда задавать явно
      params.set("page", newFilters.page ?? 0);

      newFilters.status.forEach((s) => params.append("status", s));

      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    setLoading(true);
    shelfService
      .getMyShelf(filters) // важно, чтобы сервис учитывал sort и direction
      .then((data) => {
        setUserBooks(data.content);
        setTotalPages(data.totalPages);
      })
      .catch((err) => console.error("Ошибка загрузки каталога:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  // Универсальный обработчик изменения фильтра
  const handleFilterChange = (key, value) => {
    const newStatus = filters.status[0] === statusValue ? [] : [statusValue];
    handleFilterChange("status", newStatus);
  };

  // Отдельный обработчик статусов (массив)
  const handleStatusChange = (statusValue) => {
    const newStatus = filters.status.includes(statusValue)
      ? filters.status.filter((s) => s !== statusValue)
      : [...filters.status, statusValue];

    handleFilterChange("status", newStatus);
  };

  // Обработчик смены опции сортировки (по ключу select'а)
  const handleSortChange = (e) => {
    const selectedLabel = e.target.value;
    const option = SORT_OPTIONS.find((opt) => opt.label === selectedLabel);

    if (!option) return;

    const newFilters = {
      ...filters,
      sort: option.sort,
      direction: option.direction,
      page: 0,
    };

    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Текущее значение select'а нужно связать с label (или собрать value вручную)
  const currentSortOption =
    SORT_OPTIONS.find(
      (opt) => opt.sort === filters.sort && opt.direction === filters.direction
    ) || SORT_OPTIONS[0];

  return (
    <div className="catalog-page">
      <h1 className="catalog-title">Мой каталог</h1>

      {/* Панель фильтров */}
      <div className="filter-panel">
        <div className="status-filters">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-button ${
                filters.status.includes(opt.value) ? "active" : ""
              }`}
              onClick={() => handleStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          className="sort-select"
          value={currentSortOption.label}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Сетка с книгами */}
      {loading ? (
        <div className="loader">Загрузка каталога...</div>
      ) : userBooks.length > 0 ? (
        <>
          <div className="books-grid">
            {userBooks.map((userBook) => (
              <BookCard key={userBook.id} book={userBook.book} />
            ))}
          </div>
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(newPage) => handleFilterChange("page", newPage)}
          />
        </>
      ) : (
        <div className="empty-catalog">
          В вашем каталоге по выбранным фильтрам ничего нет.
        </div>
      )}
    </div>
  );
};

export default MyCatalog;
