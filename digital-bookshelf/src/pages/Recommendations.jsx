import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BookCard from "../components/book/BookCard";
import { bookService } from "../services/bookService";
import "./Recommendations.css";

const Recommendations = () => {
  const navigate = useNavigate();

  // --- STATES ---

  // Блок 1: История
  const [historyBooks, setHistoryBooks] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Блок 2: Неожиданное
  const [serendipityBooks, setSerendipityBooks] = useState([]);
  const [loadingSerendipity, setLoadingSerendipity] = useState(true);

  // Блок 3: Настроение (Интерактив)
  const [moodResults, setMoodResults] = useState([]);
  const [loadingMood, setLoadingMood] = useState(false);
  const [moodError, setMoodError] = useState("");

  // Фильтры настроения
  const [moodText, setMoodText] = useState("");
  const [lengthFilter, setLengthFilter] = useState("ANY"); // SHORT, LONG, ANY
  const [ageFilter, setAgeFilter] = useState("ANY"); // NEW, CLASSIC, ANY
  const [moodPerformed, setMoodPerformed] = useState(false); // Искали ли уже?

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadBlock1();
    loadBlock2();
  }, []);

  const loadBlock1 = async () => {
    try {
      const res = await bookService.getHistoryRecommendations(0, 10);
      setHistoryBooks(res.content || []);
    } catch (e) {
      console.error("History failed", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadBlock2 = async () => {
    try {
      const res = await bookService.getSerendipityRecommendations(0, 8);
      setSerendipityBooks(res.content || []);
    } catch (e) {
      console.error("Serendipity failed", e);
    } finally {
      setLoadingSerendipity(false);
    }
  };

  // --- MOOD SEARCH HANDLER ---
  const handleMoodSearch = async () => {
    if (!moodText.trim()) {
      setMoodError(
        "Введите описание настроения (например, 'детектив в космосе')",
      );
      return;
    }
    setMoodError("");
    setLoadingMood(true);
    setMoodPerformed(true);

    try {
      const res = await bookService.getMoodRecommendations(
        moodText,
        lengthFilter,
        ageFilter,
        0,
        12,
      );
      setMoodResults(res.content || []);
    } catch (e) {
      console.error(e);
      setMoodError("Ошибка при генерации подборки.");
    } finally {
      setLoadingMood(false);
    }
  };

  const handleBookClick = (id) => {
    navigate(`/books/${id}`);
  };

  // --- RENDER HELPERS ---
  const renderBookList = (books, loading, emptyMsg) => {
    if (loading)
      return <div className="loading-skeleton">Загрузка книг...</div>;
    if (!books || books.length === 0)
      return <div className="empty-msg">{emptyMsg}</div>;

    return (
      <div className="horizontal-scroll-container">
        {books.map((item) => (
          <div key={item.book.id} className="scroll-item">
            {/* Карточка */}
            <div
              onClick={() => handleBookClick(item.book.id)}
              className="card-click-area"
            >
              <BookCard book={item.book} />
            </div>
            {/* Объяснение (маленькое снизу) */}
            <div className="mini-explanation">
              {Math.round(item.score * 100)}% — {item.explanation}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rec-page">
      <header className="rec-header">
        <h1>Ваш персональный навигатор</h1>
        <p>Три способа найти идеальную книгу</p>
      </header>

      {/* --- БЛОК 1: КОНТЕКСТ (История) --- */}
      <section className="rec-block history-block">
        <div className="block-header">
          <h2>Продолжить погружение</h2>
          <span className="block-subtitle">
            На основе ваших последних открытий
          </span>
        </div>
        {renderBookList(
          historyBooks,
          loadingHistory,
          "Пока недостаточно данных. Начните читать или добавьте книги в избранное.",
        )}
      </section>

      {/* --- БЛОК 2: НЕОЖИДАННОЕ (Serendipity) --- */}
      <section className="rec-block serendipity-block">
        <div className="block-header">
          <h2>Выйти из пузыря</h2>
          <span className="block-subtitle">
            Книги, которые вы бы сами не нашли
          </span>
        </div>
        {renderBookList(
          serendipityBooks,
          loadingSerendipity,
          "Мы пока изучаем ваш вкус, чтобы предложить что-то необычное.",
        )}
      </section>

      {/* --- БЛОК 3: ИНТЕРАКТИВ (Настроение) --- */}
      <section className="rec-block mood-block">
        <div className="block-header">
          <h2>Микс по настроению</h2>
          <span className="block-subtitle">Вы задаете параметры — AI ищет</span>
        </div>

        <div className="mood-controls">
          {/* Текстовое поле */}
          <div className="mood-input-group">
            <input
              type="text"
              placeholder="Чего хочется? (напр. 'мрачное фэнтези про убийц')"
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMoodSearch()}
            />
            {/* 
               Здесь тоже желательно обернуть текст в span, если захотите добавить 
               стиль .mood-btn span { z-index: 1; position: relative; } в будущем,
               но пока для mood-btn это не критично, если CSS не перекрывает его.
            */}
            <button
              className="mood-btn"
              onClick={handleMoodSearch}
              disabled={loadingMood}
            >
              {loadingMood ? "Ищем..." : "Подобрать"}
            </button>
          </div>

          {moodError && <div className="mood-error">{moodError}</div>}

          {/* Фильтры (Чипсы) */}
          <div className="mood-filters">
            <div className="filter-group">
              <label>Объем:</label>
              {/* Исправление: Оборачиваем текст в span для работы z-index */}
              <button
                className={lengthFilter === "ANY" ? "active" : ""}
                onClick={() => setLengthFilter("ANY")}
              >
                <span>Любой</span>
              </button>
              <button
                className={lengthFilter === "SHORT" ? "active" : ""}
                onClick={() => setLengthFilter("SHORT")}
              >
                <span>Короткое (&lt;350)</span>
              </button>
              <button
                className={lengthFilter === "LONG" ? "active" : ""}
                onClick={() => setLengthFilter("LONG")}
              >
                <span>Длинное (&gt;500)</span>
              </button>
            </div>

            <div className="filter-group">
              <label>Эпоха:</label>
              {/* Исправление: Оборачиваем текст в span для работы z-index */}
              <button
                className={ageFilter === "ANY" ? "active" : ""}
                onClick={() => setAgeFilter("ANY")}
              >
                <span>Любая</span>
              </button>
              <button
                className={ageFilter === "NEW" ? "active" : ""}
                onClick={() => setAgeFilter("NEW")}
              >
                <span>Новое (2000+)</span>
              </button>
              <button
                className={ageFilter === "CLASSIC" ? "active" : ""}
                onClick={() => setAgeFilter("CLASSIC")}
              >
                <span>Классика (&lt;1990)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Результаты настроения */}
        <div className="mood-results-grid">
          {loadingMood && (
            <div className="loading-grid">Генерируем подборку...</div>
          )}

          {!loadingMood && moodPerformed && moodResults.length === 0 && (
            <div className="empty-grid">
              Ничего не найдено под такие строгие критерии. Попробуйте смягчить
              фильтры.
            </div>
          )}

          {!loadingMood && moodResults.length > 0 && (
            <div className="books-grid">
              {moodResults.map((item) => (
                <div key={item.book.id} className="rec-item">
                  <div className="similarity-badge-container">
                    <span className="similarity-badge medium">
                      {Math.round(item.score * 100)}%
                    </span>
                  </div>
                  <div
                    onClick={() => handleBookClick(item.book.id)}
                    className="card-click-area"
                  >
                    <BookCard book={item.book} />
                  </div>
                  <div className="rec-explanation">{item.explanation}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Recommendations;
