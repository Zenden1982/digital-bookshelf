// src/pages/Reader.jsx

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FileUploadModal from "../components/common/FileUploadModal";
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BrightnessHighIcon from "@mui/icons-material/BrightnessHigh";
import BrightnessMediumIcon from "@mui/icons-material/BrightnessMedium";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TranslateIcon from "@mui/icons-material/Translate";
import "./Reader.css";

const CHARS_PER_PAGE = 2000;

const splitTextIntoPages = (text, maxChars) => {
  const pages = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChars, text.length);

    if (endIndex < text.length) {
      const searchZoneStart = Math.max(
        startIndex,
        endIndex - Math.floor(maxChars * 0.2)
      );
      const textChunk = text.slice(searchZoneStart, endIndex);

      const lastNewLine = textChunk.lastIndexOf("\n");

      if (lastNewLine !== -1) {
        endIndex = searchZoneStart + lastNewLine + 1;
      } else {
        const lastSentenceEnd = Math.max(
          textChunk.lastIndexOf(". "),
          textChunk.lastIndexOf("! "),
          textChunk.lastIndexOf("? ")
        );

        if (lastSentenceEnd !== -1) {
          endIndex = searchZoneStart + lastSentenceEnd + 1;
        } else {
          const lastSpace = textChunk.lastIndexOf(" ");
          if (lastSpace !== -1) {
            endIndex = searchZoneStart + lastSpace;
          }
        }
      }
    }

    pages.push(text.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  return pages;
};

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userBookId, setUserBookId] = useState(null);

  const [bookmarks, setBookmarks] = useState([]);

  // Настройки чтения
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("reader-font-size") || "18")
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("reader-theme") || "light"
  );
  const [showSettings, setShowSettings] = useState(false);

  const [selection, setSelection] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const detailData = await bookService.getBookDetail(bookId);
        setTitle(detailData.book.title);

        if (detailData.userBook) {
          setUserBookId(detailData.userBook.id);
        } else {
          try {
            const newUserBook = await shelfService.addBookToMyShelf({
              bookId,
              status: "READING",
            });
            setUserBookId(newUserBook.id);
          } catch (e) {
            console.error("Ошибка добавления на полку", e);
          }
        }

        const contentData = await bookService.getBookContent(bookId);

        if (contentData && contentData.content) {
          const text = contentData.content;
          setContent(text);

          const chunks = splitTextIntoPages(text, CHARS_PER_PAGE);
          setPages(chunks);

          if (detailData.userBook && detailData.userBook.currentPage) {
            const savedPage = detailData.userBook.currentPage - 1;
            setCurrentPage(Math.min(savedPage, chunks.length - 1));
          }

          const savedBookmarks = JSON.parse(
            localStorage.getItem(`bookmarks-${bookId}`) || "[]"
          );
          setBookmarks(savedBookmarks);
        } else {
          setContent(null);
        }
      } catch (error) {
        console.error("Ошибка загрузки читалки", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookId]);

  useEffect(() => {
    localStorage.setItem("reader-font-size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
  }, [theme]);

  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage < 0 || newPage >= pages.length) return;

      setCurrentPage(newPage);

      if (userBookId) {
        const progressPercent = Math.round(
          ((newPage + 1) / pages.length) * 100
        );
        shelfService
          .updateMyUserBook(userBookId, {
            currentPage: newPage + 1,
            totalPages: pages.length,
            progress: progressPercent,
          })
          .catch((e) => console.error("Ошибка сохранения прогресса", e));
      }
    },
    [pages.length, userBookId]
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") {
        handlePageChange(currentPage - 1);
      } else if (e.key === "ArrowRight") {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, handlePageChange]);

  const toggleBookmark = () => {
    const isBookmarked = bookmarks.includes(currentPage);
    let newBookmarks;

    if (isBookmarked) {
      newBookmarks = bookmarks.filter((page) => page !== currentPage);
    } else {
      newBookmarks = [...bookmarks, currentPage];
    }

    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(newBookmarks));
  };

  const goToBookmark = (page) => {
    handlePageChange(page);
    setShowSettings(false);
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: sel.toString(),
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 50,
      });
    } else {
      setSelection(null);
    }
  };

  const handleAiAction = async (actionType) => {
    if (!selection) return;

    setShowAiSidebar(true);
    setAiLoading(true);
    setAiResponse("");

    const newQuery = {
      type: actionType,
      text: selection.text,
      timestamp: new Date().toISOString(),
    };

    try {
      await new Promise((r) => setTimeout(r, 1500));

      let fakeResponse = "";
      if (actionType === "explain") {
        fakeResponse = `Объяснение фрагмента: "${selection.text}"\n\nЭто может означать...`;
      } else if (actionType === "translate") {
        fakeResponse = `Перевод: [Здесь будет перевод текста на выбранный язык]`;
      } else if (actionType === "summary") {
        fakeResponse = `Краткое содержание выделенного фрагмента...`;
      }

      setAiResponse(fakeResponse);
      setAiHistory([...aiHistory, { ...newQuery, response: fakeResponse }]);
    } catch (e) {
      setAiResponse("Ошибка AI сервиса.");
    } finally {
      setAiLoading(false);
      setSelection(null);
      window.getSelection().removeAllRanges();
    }
  };

  if (loading) {
    return (
      <div className="reader-loading">
        <div className="loader-spinner"></div>
        <p>Открываем книгу...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="reader-container">
        <header className="reader-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </button>
          <h1 className="reader-title">{title}</h1>
        </header>

        <div className="reader-empty-state">
          <div className="empty-message-box">
            <MenuBookIcon style={{ fontSize: 64, color: "#95A5A6" }} />
            <h2>Текст книги отсутствует</h2>
            <p>К сожалению, текст этой книги пока не добавлен в библиотеку.</p>

            <div className="empty-actions">
              <p>У вас есть файл (.txt)? Загрузите его:</p>
              <button
                className="btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <CloudUploadIcon />
                <span>Загрузить файл</span>
              </button>
              <p className="hint-text">
                Книга сохранится как ваша личная копия.
              </p>
            </div>
          </div>
        </div>

        {showUploadModal && (
          <FileUploadModal
            userBookId={userBookId}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(currentPage);

  return (
    <div className={`reader-container theme-${theme}`}>
      <header className="reader-header">
        <div className="header-left">
          <button
            className="icon-btn"
            onClick={() => navigate(-1)}
            title="Назад"
          >
            <ArrowBackIcon />
          </button>
          <h1 className="reader-title">{title}</h1>
        </div>

        <div className="header-right">
          <button
            className="icon-btn"
            onClick={toggleBookmark}
            title={isBookmarked ? "Удалить закладку" : "Добавить закладку"}
          >
            {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowAiSidebar(!showAiSidebar)}
            title="AI Ассистент"
          >
            <SmartToyIcon />
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Настройки"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3>
              <FormatSizeIcon /> Размер шрифта
            </h3>
            <div className="font-size-controls">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
              >
                A-
              </button>
              <span>{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
              >
                A+
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <BrightnessHighIcon /> Тема
            </h3>
            <div className="theme-controls">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                <BrightnessHighIcon /> Светлая
              </button>
              <button
                className={theme === "sepia" ? "active" : ""}
                onClick={() => setTheme("sepia")}
              >
                <BrightnessMediumIcon /> Сепия
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                🌙 Тёмная
              </button>
            </div>
          </div>

          {bookmarks.length > 0 && (
            <div className="settings-section">
              <h3>
                <BookmarkIcon /> Закладки ({bookmarks.length})
              </h3>
              <div className="bookmarks-list">
                {bookmarks
                  .sort((a, b) => a - b)
                  .map((page) => (
                    <button
                      key={page}
                      className="bookmark-item"
                      onClick={() => goToBookmark(page)}
                    >
                      <BookmarkIcon />
                      <span>Страница {page + 1}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className="reader-content"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <div className="page-text" style={{ fontSize: `${fontSize}px` }}>
          {pages[currentPage]}
        </div>
      </div>

      <footer className="reader-footer">
        <button
          className="nav-btn"
          disabled={currentPage === 0}
          onClick={() => handlePageChange(currentPage - 1)}
          title="Предыдущая страница (←)"
        >
          <ArrowBackIosIcon />
        </button>

        <div className="page-info">
          <span className="page-numbers">
            {currentPage + 1} / {pages.length}
          </span>
          <div className="progress-bar-mini">
            <div
              className="progress-fill-mini"
              style={{
                width: `${((currentPage + 1) / pages.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <button
          className="nav-btn"
          disabled={currentPage === pages.length - 1}
          onClick={() => handlePageChange(currentPage + 1)}
          title="Следующая страница (→)"
        >
          <ArrowForwardIosIcon />
        </button>
      </footer>

      {selection && !showAiSidebar && (
        <div
          className="ai-tooltip"
          style={{ top: selection.y, left: selection.x }}
        >
          <button onClick={() => handleAiAction("explain")}>
            <LightbulbIcon fontSize="small" /> Объяснить
          </button>
          <button onClick={() => handleAiAction("translate")}>
            <TranslateIcon fontSize="small" /> Перевести
          </button>
          <button onClick={() => handleAiAction("summary")}>
            <SummarizeIcon fontSize="small" /> Краткое
          </button>
        </div>
      )}

      <div className={`ai-sidebar ${showAiSidebar ? "open" : ""}`}>
        <div className="ai-sidebar-header">
          <h3>
            <SmartToyIcon /> AI Ассистент
          </h3>
          <button className="icon-btn" onClick={() => setShowAiSidebar(false)}>
            <CloseIcon />
          </button>
        </div>

        <div className="ai-sidebar-content">
          {aiLoading ? (
            <div className="ai-thinking">
              <div className="loader-spinner small"></div>
              <p>Думаю...</p>
            </div>
          ) : aiResponse ? (
            <div className="ai-response">
              <div className="ai-query">
                <strong>Ваш запрос:</strong>
                <p>
                  "{selection?.text || aiHistory[aiHistory.length - 1]?.text}"
                </p>
              </div>
              <div className="ai-answer">
                <strong>Ответ:</strong>
                <p>{aiResponse}</p>
              </div>
            </div>
          ) : (
            <div className="ai-empty">
              <SmartToyIcon style={{ fontSize: 48, opacity: 0.3 }} />
              <p>Выделите текст, чтобы задать вопрос AI</p>
            </div>
          )}

          {aiHistory.length > 0 && !aiLoading && (
            <div className="ai-history">
              <h4>История запросов</h4>
              {aiHistory
                .slice()
                .reverse()
                .map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-query">
                      <strong>
                        {item.type === "explain"
                          ? "💡"
                          : item.type === "translate"
                          ? "🌐"
                          : "📝"}
                      </strong>
                      <span>"{item.text.substring(0, 50)}..."</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reader;
