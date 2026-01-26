import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FileUploadModal from "../components/common/FileUploadModal";
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SettingsIcon from "@mui/icons-material/Settings";
import "./Reader.css";

// ===== FB2 PARSER (Без изменений) =====
const parseFB2ToHTML = (fb2Content) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fb2Content, "text/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("XML parsing error:", parserError.textContent);
      return null;
    }

    let html = '<div class="fb2-content">';
    const body = xmlDoc.querySelector("body");
    if (!body) return null;

    const processNode = (node) => {
      let result = "";
      switch (node.nodeName) {
        case "title":
          const titleParagraphs = node.querySelectorAll("p");
          if (titleParagraphs.length > 0) {
            result += '<h2 class="fb2-title">';
            titleParagraphs.forEach((p) => {
              result += `<p>${escapeHtml(p.textContent)}</p>`;
            });
            result += "</h2>";
          }
          break;
        case "subtitle":
          result += `<h3 class="fb2-subtitle">${escapeHtml(node.textContent)}</h3>`;
          break;
        case "p":
          const text = node.textContent.trim();
          if (text) {
            result += `<p>${processInlineElements(node)}</p>`;
          }
          break;
        case "empty-line":
          result += '<div class="empty-line"></div>';
          break;
        case "section":
          result += '<section class="fb2-section">';
          node.childNodes.forEach((child) => {
            if (child.nodeType === 1) result += processNode(child);
          });
          result += "</section>";
          break;
        case "epigraph":
          result += '<div class="fb2-epigraph">';
          node.childNodes.forEach((child) => {
            if (child.nodeType === 1) result += processNode(child);
          });
          result += "</div>";
          break;
        case "cite":
          result += '<blockquote class="fb2-cite">';
          node.childNodes.forEach((child) => {
            if (child.nodeType === 1) result += processNode(child);
          });
          result += "</blockquote>";
          break;
        case "text-author":
          result += `<p class="fb2-text-author">${escapeHtml(node.textContent)}</p>`;
          break;
      }
      return result;
    };

    const processInlineElements = (node) => {
      let result = "";
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) {
          result += escapeHtml(child.textContent);
        } else if (child.nodeType === 1) {
          switch (child.nodeName) {
            case "emphasis":
              result += `<em>${escapeHtml(child.textContent)}</em>`;
              break;
            case "strong":
              result += `<strong>${escapeHtml(child.textContent)}</strong>`;
              break;
            default:
              result += escapeHtml(child.textContent);
          }
        }
      });
      return result;
    };

    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    };

    body.childNodes.forEach((child) => {
      if (child.nodeType === 1) html += processNode(child);
    });

    html += "</div>";
    return html;
  } catch (error) {
    console.error("Error parsing FB2:", error);
    return null;
  }
};

// Константа отступа между колонками (должна совпадать с CSS)
const COLUMN_GAP = 60;

const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [htmlContent, setHtmlContent] = useState("");
  const [title, setTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userBookId, setUserBookId] = useState(null);

  // 1. Новое состояние для хранения прогресса (процентов)
  const [initialProgress, setInitialProgress] = useState(null);

  // Настройки
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("reader-font-size") || "18"),
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("reader-theme") || "light",
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ВАЖНО: Храним ширину контента, а не ширину окна
  const [contentWidth, setContentWidth] = useState(800);

  useEffect(() => {
    localStorage.setItem("reader-font-size", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
  }, [theme]);

  // Загрузка книги
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const detail = await bookService.getBookDetail(bookId);
        setTitle(detail.book.title);

        if (detail.userBook) {
          setUserBookId(detail.userBook.id);

          // 2. Если есть сохраненный прогресс, запоминаем его (не применяем сразу)
          if (detail.userBook.progress) {
            setInitialProgress(detail.userBook.progress);
          }
        }

        const contentData = await bookService.getBookContent(bookId);
        if (contentData && contentData.content) {
          const content = contentData.content;

          if (content.includes("<?xml") || content.includes("<FictionBook")) {
            console.log("Detected FB2 format, parsing...");
            const parsedHtml = parseFB2ToHTML(content);
            setHtmlContent(parsedHtml || "<p>Ошибка парсинга FB2</p>");
          } else {
            console.log("Detected HTML format");
            setHtmlContent(content);
          }
        }
      } catch (e) {
        console.error("Error loading book:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookId]);

  // ПЕРЕСЧЕТ СТРАНИЦ и ВОССТАНОВЛЕНИЕ ПОЗИЦИИ
  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    const calculateLayout = () => {
      const element = contentRef.current;

      // Получаем реальную ширину колонки
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      setContentWidth(width);

      // Считаем общее количество страниц
      const total = Math.ceil(
        (element.scrollWidth + COLUMN_GAP) / (width + COLUMN_GAP),
      );

      setTotalPages(Math.max(1, total));

      // 3. Логика восстановления: применяем прогресс только когда страницы посчитаны
      if (initialProgress !== null && total > 0) {
        // Формула: (Процент / 100) * Всего страниц = Индекс страницы
        // Используем Math.floor, чтобы не перепрыгнуть вперед
        // Math.max(0, ...) и Math.min(..., total - 1) для безопасности границ
        let targetPage = Math.floor((initialProgress / 100) * total);

        // Коррекция: если прогресс был 100%, не улетаем за пределы массива
        if (initialProgress === 100) targetPage = total - 1;

        targetPage = Math.max(0, Math.min(targetPage, total - 1));

        setCurrentPage(targetPage);

        // Сбрасываем флаг, чтобы при ресайзе окна нас не откидывало
        setInitialProgress(null);
      }
    };

    // Даем браузеру время на рендер стилей
    const timer = setTimeout(calculateLayout, 150);
    window.addEventListener("resize", calculateLayout);

    return () => {
      window.removeEventListener("resize", calculateLayout);
      clearTimeout(timer);
    };
  }, [htmlContent, fontSize, showSettings, initialProgress]); // Добавлен initialProgress

  // Навигация
  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);

    // 4. Сохраняем прогресс (Округляем, чтобы не хранить дроби)
    if (userBookId) {
      const progress = Math.round(((newPage + 1) / totalPages) * 100);
      shelfService
        .updateMyUserBook(userBookId, { progress })
        .catch(console.error);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") handlePageChange(currentPage - 1);
      if (e.key === "ArrowRight") handlePageChange(currentPage + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]); // handlePageChange зависит от userBookId

  // RENDER
  if (loading) return <div className="reader-loading">Загрузка...</div>;

  if (!htmlContent) {
    return (
      <div className="reader-container">
        <div className="reader-empty-state">
          <div className="empty-message-box">
            <h2>📖 Нет текста</h2>
            <p>Для этой книги еще не загружен текст</p>
            <button
              className="btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              Загрузить файл
            </button>
          </div>
        </div>
        {showUploadModal && (
          <FileUploadModal
            userBookId={userBookId}
            bookId={bookId}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => window.location.reload()}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`reader-container theme-${theme}`}>
      <header className="reader-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </button>
        <span className="reader-title">{title}</span>
        <button
          className="icon-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SettingsIcon />
        </button>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3>Размер шрифта</h3>
            <div className="font-size-controls">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                disabled={fontSize <= 12}
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
            <h3>Тема</h3>
            <div className="theme-controls">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                ☀️ Светлая
              </button>
              <button
                className={theme === "sepia" ? "active" : ""}
                onClick={() => setTheme("sepia")}
              >
                📜 Сепия
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                🌙 Темная
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ОБЛАСТЬ ЧТЕНИЯ */}
      <div className="reader-viewport">
        <div
          ref={contentRef}
          className="reader-content"
          style={{
            fontSize: `${fontSize}px`,
            // Математика сдвига: -Page * (Ширина контента + GAP)
            transform: `translateX(${-currentPage * (contentWidth + COLUMN_GAP)}px)`,
            // Жестко задаем ширину колонки, чтобы браузер не самовольничал
            columnWidth: `${contentWidth}px`,
            columnGap: `${COLUMN_GAP}px`,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <footer className="reader-footer">
        <button
          className="icon-btn nav-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ArrowBackIosIcon />
        </button>

        <div className="page-info">
          <span className="page-numbers">
            {currentPage + 1} / {totalPages}
          </span>
          <div className="progress-bar-mini">
            <div
              className="progress-fill-mini"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
          </div>
        </div>

        <button
          className="icon-btn nav-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          <ArrowForwardIosIcon />
        </button>
      </footer>
    </div>
  );
};

export default Reader;
