// src/pages/BookDetailPage.jsx

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

// Сервисы
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";

// Компоненты
import BookCard from "../components/book/BookCard";

// MUI Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PauseCircleFilledIcon from "@mui/icons-material/PauseCircleFilled";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import "./BookDetailPage.css";

const BookDetailPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [bookData, setBookData] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  const fetchSimilarBooks = useCallback(() => {
    bookService
      .findSimilarBooks(bookId, 4)
      .then((data) => {
        setSimilarBooks(data);
      })
      .catch((err) => console.error("Ошибка загрузки похожих книг:", err));
  }, [bookId]);

  useEffect(() => {
    fetchBookData();
    fetchSimilarBooks();
  }, [fetchBookData, fetchSimilarBooks]);

  const handleRatingChange = async (newRating) => {
    if (!bookData.userBook) return;

    setIsUpdating(true);
    try {
      await shelfService.updateMyUserBook(bookData.userBook.id, {
        rating: newRating,
      });
      fetchBookData();
    } catch (err) {
      console.error("Ошибка обновления рейтинга:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddToShelf = async (status = "PLAN_TO_READ") => {
    setIsUpdating(true);
    try {
      await shelfService.addBookToMyShelf({
        bookId: bookData.book.id,
        status,
      });
      fetchBookData();
    } catch (err) {
      console.error("Ошибка добавления книги:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="loader-container">
          <div className="loader-spinner"></div>
          <p>Загрузка книги...</p>
        </div>
      </div>
    );
  }

  if (error || !bookData) {
    return (
      <div className="book-detail-page">
        <div className="error-container">
          <p className="error-message">{error || "Книга не найдена"}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const { book, userBook } = bookData;
  const coverUrl =
    book.coverUrl || "https://via.placeholder.com/400x600.png?text=Нет+обложки";

  return (
    <div className="book-detail-page">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowBackIcon />
        <span>Назад</span>
      </button>

      <div className="book-detail-container">
        <aside className="book-sidebar">
          <div className="cover-wrapper">
            <img
              src={coverUrl}
              alt={`Обложка ${book.title}`}
              className="book-cover"
            />
            <div className="cover-gradient"></div>
          </div>

          <div className="book-actions">
            {userBook ? (
              <>
                <div className="rating-section">
                  <p className="rating-label">Ваша оценка</p>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(star)}
                        className={`star-button ${
                          isUpdating ? "disabled" : ""
                        }`}
                        disabled={isUpdating}
                      >
                        {userBook.rating >= star ? (
                          <StarIcon className="star-filled" />
                        ) : (
                          <StarBorderIcon className="star-empty" />
                        )}
                      </button>
                    ))}
                  </div>
                  {userBook.rating > 0 && (
                    <p className="rating-text">{userBook.rating} из 5</p>
                  )}
                </div>

                {userBook.progress > 0 && (
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Прогресс</span>
                      <span className="progress-percent">
                        {userBook.progress}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${userBook.progress}%` }}
                      />
                    </div>
                    {userBook.currentPage && userBook.totalPages && (
                      <p className="progress-pages">
                        {userBook.currentPage} из {userBook.totalPages} стр.
                      </p>
                    )}
                  </div>
                )}

                <Link
                  to={`/reader/${book.id}`}
                  className="btn-primary btn-read"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "16px",
                    textDecoration: "none",
                  }}
                >
                  <MenuBookIcon />
                  <span>Читать книгу</span>
                </Link>

                {userBook.tags && userBook.tags.length > 0 && (
                  <div className="tags-section">
                    <p className="tags-label">
                      <LocalOfferIcon />
                      <span>Теги</span>
                    </p>
                    <div className="tags-list">
                      {userBook.tags.map((tag) => (
                        <span key={tag.id} className="tag">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="add-to-shelf-label">Добавить на полку:</p>
                <button
                  onClick={() => handleAddToShelf("READING")}
                  className="btn-primary"
                  disabled={isUpdating}
                >
                  <AutoStoriesIcon /> Читаю
                </button>
                <button
                  onClick={() => handleAddToShelf("PLAN_TO_READ")}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  <PlaylistAddIcon /> В планах
                </button>
                <button
                  onClick={() => handleAddToShelf("FINISHED")}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  <CheckCircleIcon /> Прочитано
                </button>
              </>
            )}
          </div>
        </aside>

        <main className="book-content">
          <header className="book-header">
            <h1 className="book-title">{book.title}</h1>
            <h2 className="book-author">Автор: {book.author}</h2>
          </header>

          <div className="book-meta">
            {book.publishedDate && (
              <div className="meta-item">
                <CalendarTodayIcon />
                <span>Год издания: {book.publishedDate.split("-")[0]}</span>
              </div>
            )}
            {book.pageCount > 0 && (
              <div className="meta-item">
                <DescriptionIcon />
                <span>{book.pageCount} страниц</span>
              </div>
            )}
            {book.isbn && (
              <div className="meta-item">
                <span className="isbn-label">ISBN:</span>
                <span>{book.isbn}</span>
              </div>
            )}
            {book.genres && book.genres.length > 0 && (
              <div className="genres-section">
                <p className="genres-label">
                  <LocalOfferIcon fontSize="small" />
                  <span>Жанры</span>
                </p>
                <div className="genres-list">
                  {book.genres.map((genre, index) => (
                    <span key={index} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <section className="annotation-section">
            <h3 className="section-title">Описание</h3>
            <div className="annotation-content">
              {book.annotation ? (
                <p>{book.annotation}</p>
              ) : (
                <p className="no-annotation">Описание отсутствует</p>
              )}
            </div>
          </section>

          {userBook && (
            <section className="additional-info">
              <h3 className="section-title">Дополнительно</h3>
              <div className="info-grid">
                <div className="info-card">
                  <p className="info-label">Дата добавления</p>
                  <p className="info-value">
                    {new Date(userBook.addedAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                {userBook.updatedAt && (
                  <div className="info-card">
                    <p className="info-label">Последнее обновление</p>
                    <p className="info-value">
                      {new Date(userBook.updatedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                )}
                <div className="info-card">
                  <p className="info-label">Статус</p>
                  <p className="info-value status-value">
                    {userBook.status === "READING" && (
                      <>
                        <AutoStoriesIcon fontSize="small" /> Читаю
                      </>
                    )}
                    {userBook.status === "PLAN_TO_READ" && (
                      <>
                        <PlaylistAddIcon fontSize="small" /> В планах
                      </>
                    )}
                    {userBook.status === "FINISHED" && (
                      <>
                        <CheckCircleIcon fontSize="small" /> Прочитано
                      </>
                    )}
                    {userBook.status === "ABANDONED" && (
                      <>
                        <PauseCircleFilledIcon fontSize="small" /> Отложено
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}

          <button className="btn-secondary btn-edit">
            <EditIcon />
            <span>Редактировать информацию</span>
          </button>

          {similarBooks.length > 0 && (
            <section className="similar-books-section">
              <h3 className="section-title">Похожие книги</h3>
              <div className="similar-books-grid">
                {similarBooks.map((similarBook) => (
                  <Link
                    to={`/book/${similarBook.id}`}
                    key={similarBook.id}
                    className="similar-book-link"
                  >
                    <BookCard book={similarBook} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {isUpdating && (
        <div className="updating-overlay">
          <div className="loader-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default BookDetailPage;
