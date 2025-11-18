// src/pages/BookDetailPage.jsx

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

// Сервисы
import { bookService } from "../services/bookService";

// Компоненты для отображения данных
import BookCard from "../components/book/BookCard";
import UserBookCard from "../components/book/UserBookCard";

import "./BookDetailPage.css";

const BookDetailPage = () => {
  const { bookId } = useParams();

  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookData = useCallback(() => {
    setLoading(true);
    bookService
      .getBookDetail(bookId)
      .then((data) => {
        setBookData(data);
        setError("");
      })
      .catch((err) => {
        setError("Не удалось загрузить информацию о книге.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    fetchBookData();
  }, [fetchBookData]);

  if (loading) return <div className="loader">Загрузка книги...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!bookData) return <div className="error-message">Книга не найдена.</div>;

  const { book, userBook } = bookData;
  const coverUrl =
    book.coverUrl || "https://via.placeholder.com/250x380.png?text=Нет+обложки";

  return (
    <div className="book-detail-page">
      <div className="book-detail-main">
        <div className="book-cover-actions">
          <img
            src={coverUrl}
            alt={`Обложка ${book.title}`}
            className="book-detail-cover"
          />

          <div className="action-widget">
            {userBook ? (
              <UserBookCard userBook={userBook} onUpdate={fetchBookData} />
            ) : (
              <BookCard book={book} onAdd={fetchBookData} />
            )}
          </div>

          {userBook && (
            <Link to={`/reader/${book.id}`} className="read-button">
              Начать читать
            </Link>
          )}
        </div>

        <div className="book-info">
          <h1 className="book-title">{book.title}</h1>
          <h2 className="book-author">{book.author}</h2>

          <div className="book-meta">
            {book.publishedDate && (
              <span>{book.publishedDate.split("-")[0]} г.</span>
            )}
            {book.pageCount > 0 && <span>{book.pageCount} стр.</span>}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
          </div>

          <h3>Аннотация</h3>
          <p className="book-annotation">
            {book.annotation || "Аннотация отсутствует."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
