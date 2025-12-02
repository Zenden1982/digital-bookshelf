// src/pages/SearchResults.jsx

import PsychologyIcon from "@mui/icons-material/Psychology";
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
  const mode = searchParams.get("mode") || "regular";
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
        let results;

        if (mode === "semantic") {
          results = await bookService.findSimilarBooksByQuery(
            query,
            20,
            page,
            20
          );
        } else {
          results = await bookService.searchLocal(query, page, 20);
        }

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
  }, [query, mode, page]);

  const handlePageChange = (newPage) => {
    setSearchParams({ q: query, mode: mode, page: newPage });
  };

  const hasResults = !loading && books.length > 0;

  return (
    <div className="search-results-page">
      <header className="search-header">
        <div className="search-info">
          {mode === "semantic" ? (
            <PsychologyIcon sx={{ fontSize: 28, color: "#8b4513" }} />
          ) : (
            <SearchIcon sx={{ fontSize: 28 }} />
          )}
          <div>
            <h1>
              {mode === "semantic"
                ? "Семантический поиск"
                : "Результаты поиска"}
            </h1>
            <p className="search-query">
              {mode === "semantic" ? "По смыслу: " : "Запрос: "}
              <strong>"{query}"</strong>
            </p>
          </div>
        </div>
      </header>

      {loading && <div className="loading-spinner">Поиск книг...</div>}

      {error && <div className="error-message">{error}</div>}

      {hasResults && (
        <>
          <div className="results-count">
            Найдено книг: <strong>{books.length}</strong>
          </div>
          <div className="books-grid">
            {books.map((book) => (
              <Link
                to={`/book/${book.id}`}
                key={book.id}
                className="book-card-link"
              >
                <BookCard book={book} />
              </Link>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!loading && !error && books.length === 0 && query && (
        <div className="no-results">
          <SearchIcon sx={{ fontSize: 64, color: "#95a5a6" }} />
          <h2>Ничего не найдено</h2>
          <p>
            {mode === "semantic"
              ? "Попробуйте изменить запрос или переключиться на обычный поиск"
              : "Попробуйте изменить запрос или использовать семантический поиск"}
          </p>
          <Link to="/import" className="import-link">
            Попробуйте найти книгу в глобальном каталоге и добавить её на наш
            сайт.
          </Link>
          <Link to="/import" className="btn-primary">
            Перейти к импорту
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
