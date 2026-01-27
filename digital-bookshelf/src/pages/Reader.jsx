import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FileUploadModal from "../components/common/FileUploadModal";
import ReaderAiDrawer from "../components/reader/ReaderAiDrawer";

import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import PsychologyIcon from "@mui/icons-material/Psychology";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TranslateIcon from "@mui/icons-material/Translate";

import "./Reader.css";

// ===== FB2 PARSER (без изменений) =====
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

    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
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

    const processNode = (node) => {
      let result = "";
      switch (node.nodeName) {
        case "title": {
          const titleParagraphs = node.querySelectorAll("p");
          if (titleParagraphs.length > 0) {
            result += '<h2 class="fb2-title">';
            titleParagraphs.forEach((p) => {
              result += `<p>${escapeHtml(p.textContent)}</p>`;
            });
            result += "</h2>";
          }
          break;
        }
        case "subtitle":
          result += `<h3 class="fb2-subtitle">${escapeHtml(node.textContent)}</h3>`;
          break;
        case "p": {
          const text = node.textContent.trim();
          if (text) result += `<p>${processInlineElements(node)}</p>`;
          break;
        }
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

const COLUMN_GAP = 60;
const MAX_SELECTED = 6000;

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

  const [initialProgress, setInitialProgress] = useState(null);

  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("reader-font-size") || "18", 10),
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("reader-theme") || "light",
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [contentWidth, setContentWidth] = useState(800);

  // AI
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  // popover над выделением
  const [selectionUI, setSelectionUI] = useState({
    open: false,
    x: 0,
    y: 0,
  });

  // параметры запуска AI при открытии
  const [aiInitialAction, setAiInitialAction] = useState("qa");
  const [aiAutoSend, setAiAutoSend] = useState(false);

  useEffect(
    () => localStorage.setItem("reader-font-size", fontSize.toString()),
    [fontSize],
  );
  useEffect(() => localStorage.setItem("reader-theme", theme), [theme]);

  useEffect(() => {
    if (aiOpen) setShowSettings(false);
  }, [aiOpen]);

  // Загрузка книги
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const detail = await bookService.getBookDetail(bookId);
        setTitle(detail.book.title);

        if (detail.userBook) {
          setUserBookId(detail.userBook.id);
          if (
            detail.userBook.progress !== null &&
            detail.userBook.progress !== undefined
          ) {
            setInitialProgress(detail.userBook.progress);
          }
        }

        const contentData = await bookService.getBookContent(bookId);
        if (contentData && contentData.content) {
          const content = contentData.content;

          if (content.includes("<?xml") || content.includes("<FictionBook")) {
            const parsedHtml = parseFB2ToHTML(content);
            setHtmlContent(parsedHtml || "<p>Ошибка парсинга FB2</p>");
          } else {
            setHtmlContent(content);
          }
        } else {
          setHtmlContent("");
        }
      } catch (e) {
        console.error("Error loading book:", e);
        setHtmlContent("");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [bookId]);

  // Пересчет страниц + восстановление позиции
  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    const calculateLayout = () => {
      const element = contentRef.current;

      const rect = element.getBoundingClientRect();
      const width = rect.width || 800;
      setContentWidth(width);

      const total = Math.ceil(
        (element.scrollWidth + COLUMN_GAP) / (width + COLUMN_GAP),
      );
      const safeTotal = Math.max(1, total);
      setTotalPages(safeTotal);

      if (initialProgress !== null && safeTotal > 0) {
        let targetPage = Math.floor((initialProgress / 100) * safeTotal);
        if (initialProgress === 100) targetPage = safeTotal - 1;
        targetPage = Math.max(0, Math.min(targetPage, safeTotal - 1));
        setCurrentPage(targetPage);
        setInitialProgress(null);
      }
    };

    const timer = setTimeout(calculateLayout, 150);
    window.addEventListener("resize", calculateLayout);
    return () => {
      window.removeEventListener("resize", calculateLayout);
      clearTimeout(timer);
    };
  }, [htmlContent, fontSize, showSettings, initialProgress]);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);

    if (userBookId) {
      const progress = Math.round(((newPage + 1) / totalPages) * 100);
      shelfService
        .updateMyUserBook(userBookId, { progress })
        .catch(console.error);
    }
  };

  // Клавиши навигации + AI hotkeys
  useEffect(() => {
    const handleKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (isTyping) return;

      if (e.key === "ArrowLeft") handlePageChange(currentPage - 1);
      if (e.key === "ArrowRight") handlePageChange(currentPage + 1);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAiInitialAction("qa");
        setAiAutoSend(false);
        setAiOpen(true);
      }

      if (e.key === "Escape") {
        setShowSettings(false);
        setAiOpen(false);
        setSelectionUI({ open: false, x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]);

  // Хелпер: открыть AI по выбранному действию
  const openAiForAction = (action) => {
    setAiInitialAction(action);
    // если есть выделение — сразу отправляем
    setAiAutoSend(Boolean(selectedText && selectedText.trim().length > 0));
    setAiOpen(true);
    setSelectionUI({ open: false, x: 0, y: 0 });
  };

  // Выделение текста -> показываем мини-панель возле выделения
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const clearIfOutside = (evt) => {
      // если кликнули вне панели выбора — скрыть
      const pop = document.querySelector(".selection-ai-popover");
      if (pop && pop.contains(evt.target)) return;
      setSelectionUI((prev) => ({ ...prev, open: false }));
    };

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel) return;

      const text = sel.toString().trim();
      if (!text) {
        setSelectionUI((prev) => ({ ...prev, open: false }));
        return;
      }

      // только если выделение внутри контента
      const anchorNode = sel.anchorNode;
      if (!anchorNode || !el.contains(anchorNode)) {
        setSelectionUI((prev) => ({ ...prev, open: false }));
        return;
      }

      // ограничиваем
      setSelectedText(text.slice(0, MAX_SELECTED));

      // позиция панели: берём bounding rect выделения
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      if (!range) return;

      const rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return;

      // Позиционирование относительно окна
      const x = rect.left + rect.width / 2;
      const y = Math.max(12, rect.top - 10);

      setSelectionUI({ open: true, x, y });
    };

    el.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", clearIfOutside);

    return () => {
      el.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", clearIfOutside);
    };
  }, [htmlContent, selectedText]);

  if (loading) return <div className="reader-loading">Загрузка...</div>;

  if (!htmlContent) {
    return (
      <div className={`reader-container theme-${theme}`}>
        <header className="reader-header">
          <button
            className="icon-btn"
            onClick={() => navigate(-1)}
            title="Назад"
          >
            <ArrowBackIcon />
          </button>

          <span className="reader-title">{title || "Читалка"}</span>

          <div className="reader-header-actions">
            <button
              className="icon-btn"
              onClick={() => setAiOpen(true)}
              title="AI помощник (Ctrl+K)"
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

        <div className="reader-empty-state">
          <div className="empty-message-box">
            <h2>Нет текста</h2>
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

        <ReaderAiDrawer
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          selectedText={selectedText}
          bookTitle={title}
          initialAction={aiInitialAction}
          autoSendOnOpen={aiAutoSend}
        />
      </div>
    );
  }

  return (
    <div className={`reader-container theme-${theme}`}>
      <header className="reader-header">
        <button className="icon-btn" onClick={() => navigate(-1)} title="Назад">
          <ArrowBackIcon />
        </button>

        <span className="reader-title">{title}</span>

        <div className="reader-header-actions">
          <button
            className="icon-btn"
            onClick={() => {
              setAiInitialAction("qa");
              setAiAutoSend(false);
              setAiOpen(true);
            }}
            title="AI помощник (Ctrl+K)"
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
            <h3>Размер шрифта</h3>
            <div className="font-size-controls">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                disabled={fontSize <= 12}
                title="Уменьшить"
              >
                A-
              </button>
              <span>{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
                title="Увеличить"
              >
                A+
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h3>Тема</h3>
            <div className="theme-controls">
              <button
                className={theme === "light" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("light")}
                title="Светлая"
              >
                <LightModeIcon fontSize="small" />
                <span>Светлая</span>
              </button>

              <button
                className={theme === "sepia" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("sepia")}
                title="Сепия"
              >
                <AutoAwesomeIcon fontSize="small" />
                <span>Сепия</span>
              </button>

              <button
                className={theme === "dark" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("dark")}
                title="Темная"
              >
                <DarkModeIcon fontSize="small" />
                <span>Темная</span>
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
            transform: `translateX(${-currentPage * (contentWidth + COLUMN_GAP)}px)`,
            columnWidth: `${contentWidth}px`,
            columnGap: `${COLUMN_GAP}px`,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* popover над выделением */}
        {selectionUI.open && (
          <div
            className="selection-ai-popover"
            style={{
              left: `${selectionUI.x}px`,
              top: `${selectionUI.y}px`,
            }}
          >
            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("explain")}
              title="Объяснить"
            >
              <PsychologyIcon fontSize="small" />
              <span>Объяснить</span>
            </button>

            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("translate")}
              title="Перевести"
            >
              <TranslateIcon fontSize="small" />
              <span>Перевод</span>
            </button>

            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("summarize")}
              title="Пересказать"
            >
              <SummarizeIcon fontSize="small" />
              <span>Пересказ</span>
            </button>

            <button
              className="sel-ai-btn primary"
              onClick={() => openAiForAction("qa")}
              title="Открыть чат"
            >
              <SmartToyIcon fontSize="small" />
              <span>Чат</span>
            </button>
          </div>
        )}
      </div>

      <footer className="reader-footer">
        <button
          className="icon-btn nav-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          title="Назад"
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
          title="Вперед"
        >
          <ArrowForwardIosIcon />
        </button>
      </footer>

      <ReaderAiDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        selectedText={selectedText}
        bookTitle={title}
        initialAction={aiInitialAction}
        autoSendOnOpen={aiAutoSend}
      />
    </div>
  );
};

export default Reader;
