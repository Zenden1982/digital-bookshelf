// src/pages/SearchResults.jsx

import SearchIcon from "@mui/icons-material/Search";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BookCard from "../components/book/BookCard";
import Pagination from "../components/common/Pagination";
import { bookService } from "../services/bookService";
import "./SearchResults.css";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "0", 10);

  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) {
      setBooks([]);
      setTotalPages(0);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await bookService.searchLocal(query, page, 20);
        setBooks(results?.content || []);
        setTotalPages(results?.totalPages || 0);
      } catch (err) {
        setError("Произошла ошибка во время поиска. Попробуйте снова.");
        setBooks([]);
        setTotalPages(0);
        console.error("Ошибка поиска:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, page]);

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, page: newPage });
  };

  // Условие показа результатов (для краткости)
  const hasResults = !loading && books.length > 0;

  return (
    <div className="search-results-page">
      <h1 className="search-title">
        Результаты поиска по запросу: <span>"{query}"</span>
      </h1>

      {loading && (
        <div className="loader">Идет поиск по нашей библиотеке...</div>
      )}
      {error && <div className="error-message">{error}</div>}

      {/* --- Сетка с результатами поиска --- */}
      {hasResults && (
        <>
          <div className="books-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* --- Блок импорта, который показывается ВСЕГДА, когда есть поисковый запрос --- */}
      {!loading && query && (
        <div className="import-prompt-persistent">
          <SearchIcon sx={{ fontSize: 40, color: "#546E7A" }} />
          <h3>Не нашли то, что искали?</h3>
          <p>
            Попробуйте найти книгу в глобальном каталоге и добавить её на наш
            сайт.
          </p>
          <Link
            to={`/import?q=${encodeURIComponent(query)}`}
            className="action-button primary"
          >
            Перейти к импорту
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
