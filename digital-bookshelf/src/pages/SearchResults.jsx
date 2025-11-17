// src/pages/SearchResults.jsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookCard from "../components/book/BookCard"; // Создадим этот компонент дальше
import { bookService } from "../services/bookService";
import "./SearchResults.css"; // И стили тоже

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q"); // Получаем поисковый запрос из URL ?q=...

  // Состояния для результатов, загрузки и ошибок
  const [myLibraryBooks, setMyLibraryBooks] = useState([]);
  const [googleBooks, setGoogleBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Эффект для выполнения поиска при изменении query
  useEffect(() => {
    // Не выполняем поиск, если запроса нет
    if (!query) {
      setMyLibraryBooks([]);
      setGoogleBooks([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await bookService.searchBooks(query);
        setMyLibraryBooks(results.myLibraryBooks || []);
        setGoogleBooks(results.googleBooks || []);
      } catch (err) {
        setError("Произошла ошибка во время поиска. Попробуйте снова.");
        console.error("Ошибка поиска:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]); // Перезапускаем эффект каждый раз, когда меняется query в URL

  // Сообщение, если ничего не найдено
  const isNotFound =
    !loading &&
    !error &&
    myLibraryBooks.length === 0 &&
    googleBooks.length === 0;

  return (
    <div className="search-results-page">
      <h1 className="search-title">
        Результаты поиска по запросу: <span>"{query}"</span>
      </h1>

      {loading && <div className="loader">Идет поиск...</div>}
      {error && <div className="error-message">{error}</div>}
      {isNotFound && (
        <div className="not-found-message">
          К сожалению, по вашему запросу ничего не найдено.
        </div>
      )}

      {/* --- Секция с книгами из вашей библиотеки --- */}
      {!loading && myLibraryBooks.length > 0 && (
        <section className="results-section">
          <h2>Найдено в вашей библиотеке</h2>
          <div className="books-grid">
            {myLibraryBooks.map((book) => (
              <BookCard
                key={`mylib-${book.id}`}
                book={book}
                type="my-library"
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Секция с книгами из Google Books --- */}
      {!loading && googleBooks.length > 0 && (
        <section className="results-section">
          <h2>Найдено в сети</h2>
          <div className="books-grid">
            {googleBooks.map((book) => (
              <BookCard
                key={`google-${book.googleBookId}`}
                book={book}
                type="google"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchResults;
