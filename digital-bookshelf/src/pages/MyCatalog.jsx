// src/pages/MyCatalog.jsx

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import UserBookCard from "../components/book/UserBookCard"; // Используем новую карточку
import Pagination from "../components/common/Pagination";
import { shelfService } from "../services/shelfService";
import "./MyCatalog.css";

// <<< ВАШИ НОВЫЕ ОПЦИИ СТАТУСОВ >>>
const STATUS_OPTIONS = [
  { value: "FINISHED", label: "Прочитано" },
  { value: "READING", label: "Читаю" },
  { value: "PLAN_TO_READ", label: "В планах" },
];

// <<< ВАШИ НОВЫЕ ОПЦИИ СОРТИРОВКИ >>>
const SORT_OPTIONS = [
  { sort: "addedAt", direction: "DESC", label: "По дате добавления (новые)" },
  { sort: "addedAt", direction: "ASC", label: "По дате добавления (старые)" },
  { sort: "book.title", direction: "ASC", label: "По названию (А-Я)" },
  { sort: "book.author", direction: "ASC", label: "По автору (А-Я)" },
  { sort: "rating", direction: "DESC", label: "По рейтингу (убывание)" },
];

const MyCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Инициализация состояния на основе URL и ваших новых опций
  const initialSortOption =
    SORT_OPTIONS.find(
      (opt) =>
        opt.sort === searchParams.get("sort") &&
        opt.direction === searchParams.get("direction")
    ) || SORT_OPTIONS[0];

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    status: searchParams.getAll("status") || [],
    sort: initialSortOption.sort,
    direction: initialSortOption.direction,
    page: parseInt(searchParams.get("page") || "0", 10),
  });

  const [userBooks, setUserBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Функция для обновления URL
  const updateUrlParams = useCallback(
    (newFilters) => {
      const params = new URLSearchParams();
      if (newFilters.query) params.set("query", newFilters.query);
      if (newFilters.sort) params.set("sort", newFilters.sort);
      if (newFilters.direction) params.set("direction", newFilters.direction);
      params.set("page", newFilters.page ?? 0);
      newFilters.status.forEach((s) => params.append("status", s));
      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Функция для загрузки данных
  const fetchCatalogData = useCallback(() => {
    setLoading(true);
    // shelfService должен уметь принимать sort и direction
    shelfService
      .getMyShelf(filters)
      .then((data) => {
        setUserBooks(data.content ?? []);
        setTotalPages(data.totalPages);
      })
      .catch((err) => console.error("Ошибка загрузки каталога:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // Обработчик статусов (логика радиокнопок)
  const handleStatusChange = (statusValue) => {
    const newStatus = filters.status[0] === statusValue ? [] : [statusValue];
    const newFilters = { ...filters, status: newStatus, page: 0 };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Обработчик смены сортировки
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

  // Обработчик смены страницы
  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  // Вычисляем текущую выбранную опцию для select'а
  const currentSortOptionLabel = (
    SORT_OPTIONS.find(
      (opt) => opt.sort === filters.sort && opt.direction === filters.direction
    ) || SORT_OPTIONS[0]
  ).label;

  return (
    <div className="catalog-page">
      <h1 className="catalog-title">Мой каталог</h1>
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
          value={currentSortOptionLabel}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="loader">Загрузка каталога...</div>
      ) : userBooks.length > 0 ? (
        <>
          <div className="books-grid">
            {userBooks.map((userBook) => (
              <UserBookCard
                key={userBook.id}
                userBook={userBook}
                onUpdate={fetchCatalogData}
              />
            ))}
          </div>
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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
