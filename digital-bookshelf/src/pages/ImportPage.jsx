// src/pages/ImportPage.jsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookCard from "../components/book/BookCard";
import Pagination from "../components/common/Pagination";
import { importService } from "../services/importService";
import { shelfService } from "../services/shelfService";
import "./ImportPage.css";

const ImportPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const urlPage = parseInt(searchParams.get("page") || "0", 10);

  const [inputQuery, setInputQuery] = useState(urlQuery);
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!urlQuery) {
      setBooks([]);
      setTotalPages(0);
      return;
    }
    const performSearch = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await importService.searchGoogle(urlQuery, urlPage, 10);
        setBooks(results?.content || []);
        setTotalPages(results?.totalPages || 0);
      } catch (err) {
        setError("Ошибка при поиске в Google. Попробуйте снова.");
        setBooks([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [urlQuery, urlPage]);

  const handleSearchFormSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: inputQuery, page: "0" });
  };

  // >>> ИЗМЕНЕНИЕ: Функция теперь работает с ISBN
  const handleImportAndAdd = async (isbn, status) => {
    const localBook = await importService.importByIsbn(isbn);
    await shelfService.addBookToMyShelf({
      bookId: localBook.id,
      status: status,
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ q: urlQuery, page: newPage });
  };

  return (
    <div className="import-page">
      <h1 className="import-title">Импорт новой книги</h1>
      <p className="import-subtitle">
        Найдите книгу в глобальном каталоге, чтобы добавить её в нашу
        библиотеку.
      </p>

      <form onSubmit={handleSearchFormSubmit} className="import-search-bar">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Введите название, автора или ISBN..."
        />
        <button type="submit" disabled={loading}>
          {loading ? "Поиск..." : "Найти"}
        </button>
      </form>

      {loading && <div className="loader">Ищем в Google Books...</div>}
      {error && <div className="error-message">{error}</div>}

      {!loading && books.length > 0 && (
        <>
          <div className="books-grid">
            {books.map((book) => (
              <BookCard
                key={book.googleBookId} // Ключ лучше оставить по googleBookId, он всегда уникален
                book={book}
                // >>> ИЗМЕНЕНИЕ: Отключаем кнопку, если нет ISBN
                isActionDisabled={!book.isbn}
                // >>> ИЗМЕНЕНИЕ: Передаем isbn в обработчик
                onImport={(status) => handleImportAndAdd(book.isbn, status)}
              />
            ))}
          </div>
          <Pagination
            currentPage={urlPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ImportPage;
