import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

// Компоненты
import FileUploadModal from "../components/common/FileUploadModal";
import ReaderAiDrawer from "../components/reader/ReaderAiDrawer";

// Сервисы
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";

// Иконки
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TranslateIcon from "@mui/icons-material/Translate";

import "./Reader.css";

/* =========================
   Constants & Utils
========================= */
const COLUMN_GAP = 60; // Должно совпадать с CSS column-gap
const MAX_SELECTED = 6000;

// Простая утилита debounce
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  return debouncedCallback;
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* =========================
   Parsers & Cleanup
========================= */
const cleanupHtml = (html) =>
  (html || "").replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");

const parseFB2ToHTML = (fb2Content) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fb2Content, "text/xml");
    if (xmlDoc.querySelector("parsererror")) return null;

    const body = xmlDoc.querySelector("body");
    if (!body) return null;

    let html = '<div class="fb2-content">';

    const escapeHtml = (text) => {
      const div = document.createElement("div");
      div.textContent = text ?? "";
      return div.innerHTML;
    };

    const processInline = (node) => {
      let out = "";
      node.childNodes.forEach((child) => {
        if (child.nodeType === 3) out += escapeHtml(child.textContent);
        else if (child.nodeType === 1) {
          switch (child.nodeName) {
            case "emphasis":
              out += `<em>${escapeHtml(child.textContent)}</em>`;
              break;
            case "strong":
              out += `<strong>${escapeHtml(child.textContent)}</strong>`;
              break;
            default:
              out += escapeHtml(child.textContent);
          }
        }
      });
      return out;
    };

    const processNode = (node) => {
      let out = "";
      switch (node.nodeName) {
        case "title": {
          const ps = node.querySelectorAll("p");
          if (ps.length) {
            out += '<h2 class="fb2-title">';
            ps.forEach((p) => (out += `<p>${escapeHtml(p.textContent)}</p>`));
            out += "</h2>";
          }
          break;
        }
        case "subtitle":
          out += `<h3 class="fb2-subtitle">${escapeHtml(node.textContent)}</h3>`;
          break;
        case "p": {
          const t = (node.textContent || "").trim();
          if (t) out += `<p>${processInline(node)}</p>`;
          break;
        }
        case "empty-line":
          out += '<div class="empty-line"></div>';
          break;
        case "section":
          out += '<section class="fb2-section">';
          node.childNodes.forEach((ch) => {
            if (ch.nodeType === 1) out += processNode(ch);
          });
          out += "</section>";
          break;
        case "epigraph":
          out += '<div class="fb2-epigraph">';
          node.childNodes.forEach((ch) => {
            if (ch.nodeType === 1) out += processNode(ch);
          });
          out += "</div>";
          break;
        case "cite":
          out += '<blockquote class="fb2-cite">';
          node.childNodes.forEach((ch) => {
            if (ch.nodeType === 1) out += processNode(ch);
          });
          out += "</blockquote>";
          break;
        case "text-author":
          out += `<p class="fb2-text-author">${escapeHtml(node.textContent)}</p>`;
          break;
        default:
          break;
      }
      return out;
    };

    body.childNodes.forEach((child) => {
      if (child.nodeType === 1) html += processNode(child);
    });

    html += "</div>";
    return html;
  } catch (e) {
    console.error("Error parsing FB2:", e);
    return null;
  }
};

const injectNodeIds = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;
  const blocks = root.querySelectorAll(
    "p, h1, h2, h3, h4, blockquote, li, div.fb2-epigraph, div.empty-line",
  );

  let i = 0;
  blocks.forEach((el) => {
    if (!el.getAttribute("data-node-id"))
      el.setAttribute("data-node-id", `n-${i++}`);
  });

  return root.innerHTML;
};

/* =========================
   Main Component
========================= */
const Reader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // Refs
  const scrollerRef = useRef(null);
  const containerRef = useRef(null);

  // State: Data
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState("");
  const [title, setTitle] = useState("");
  const [userBookId, setUserBookId] = useState(null);
  const [initialProgress, setInitialProgress] = useState(null);

  // State: Appearance
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("reader-font-size") || "18", 10),
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("reader-theme") || "light",
  );
  const [showSettings, setShowSettings] = useState(false);

  // State: Navigation
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageWidth, setPageWidth] = useState(800); // Для реактивности размеров

  // State: AI & Modal
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionUI, setSelectionUI] = useState({ open: false, x: 0, y: 0 });
  const [aiInitialAction, setAiInitialAction] = useState("qa");
  const [aiAutoSend, setAiAutoSend] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const progressPercent = totalPages
    ? ((currentPage + 1) / totalPages) * 100
    : 0;

  // Effects: LocalStorage
  useEffect(
    () => localStorage.setItem("reader-font-size", String(fontSize)),
    [fontSize],
  );
  useEffect(() => localStorage.setItem("reader-theme", theme), [theme]);
  useEffect(() => {
    if (aiOpen) setShowSettings(false);
  }, [aiOpen]);

  /* =========================
      Helpers
  ========================= */

  // Расчет страниц на основе scrollWidth
  const updateMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Реальная ширина видимой области (одна колонка)
    const clientW = el.clientWidth;
    setPageWidth(clientW);

    // Полная ширина контента (все колонки)
    const scrollW = el.scrollWidth;

    // Считаем страницы. +GAP добавляем для корректного деления,
    // так как scrollWidth включает gap-ы между колонками
    const total = Math.max(
      1,
      Math.ceil((scrollW + COLUMN_GAP) / (clientW + COLUMN_GAP)),
    );
    setTotalPages(total);
  }, []);

  const persistProgress = (idx) => {
    if (!userBookId || !totalPages) return;
    const progress = Math.round(((idx + 1) / totalPages) * 100);
    shelfService
      .updateMyUserBook(userBookId, { progress })
      .catch(console.error);
  };

  /* =========================
      Navigation Logic
  ========================= */

  const scrollToPage = (idx, behavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) return;

    // Всегда берем актуальную ширину из DOM
    const w = el.clientWidth;
    const gap = COLUMN_GAP;
    const step = w + gap;

    const targetX = idx * step;
    el.scrollTo({ left: targetX, behavior });
  };

  const goNext = () => {
    const next = Math.min(currentPage + 1, totalPages - 1);
    scrollToPage(next);
  };

  const goPrev = () => {
    const prev = Math.max(currentPage - 1, 0);
    scrollToPage(prev);
  };

  /* =========================
      Scroll Synchronization
      (Fix for drifting)
  ========================= */

  // Используем debounce для обновления стейта при скролле
  const handleScrollDebounced = useDebounce(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const currentX = el.scrollLeft;
    const w = el.clientWidth;
    const step = w + COLUMN_GAP;

    // Вычисляем индекс страницы по факту: где мы сейчас находимся?
    // Math.round исправляет мелкие смещения (1-2px)
    const actualPage = Math.round(currentX / step);

    if (actualPage !== currentPage) {
      setCurrentPage(actualPage);
      persistProgress(actualPage);
    }
  }, 100);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      handleScrollDebounced();
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleScrollDebounced]);

  /* =========================
      Fix: Prevent drag-scroll
      (Nuclear Option - overflow hidden)
  ========================= */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onMouseDown = () => {
      // 1. Запоминаем скролл
      const currentScroll = el.scrollLeft;

      // 2. Блокируем скролл на уровне CSS
      // Это полностью отключает возможность браузера двигать контент
      el.style.overflowX = "hidden";

      // 3. Восстанавливаем позицию (на случай сброса)
      el.scrollLeft = currentScroll;
    };

    const onMouseUp = () => {
      // 1. Возвращаем скролл обратно
      // Пустая строка удаляет инлайн-стиль и возвращает настройки из CSS-класса
      el.style.overflowX = "";
    };

    // Слушаем начало выделения только внутри контейнера
    el.addEventListener("mousedown", onMouseDown);
    // Слушаем конец выделения везде (вдруг мышь ушла за пределы)
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* =========================
      Load & Layout Effects
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const detail = await bookService.getBookDetail(bookId);
        setTitle(detail?.book?.title || "");

        if (detail?.userBook) {
          setUserBookId(detail.userBook.id);
          if (
            detail.userBook.progress !== null &&
            detail.userBook.progress !== undefined
          ) {
            setInitialProgress(detail.userBook.progress);
          }
        }

        const contentData = await bookService.getBookContent(bookId);
        const raw = contentData?.content;

        if (!raw) {
          setHtmlContent("");
          return;
        }

        let parsedHtml = "";
        if (raw.includes("<?xml") || raw.includes("<FictionBook")) {
          parsedHtml = parseFB2ToHTML(raw) || "<p>Ошибка парсинга FB2</p>";
        } else {
          parsedHtml = raw;
        }

        const cleaned = cleanupHtml(parsedHtml);
        setHtmlContent(injectNodeIds(cleaned));
      } catch (e) {
        console.error("Error loading book:", e);
        setHtmlContent("");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookId]);

  // Пересчет при изменении контента, шрифта или размеров окна
  useLayoutEffect(() => {
    if (!htmlContent || !scrollerRef.current) return;

    // 1. Считаем страницы
    updateMetrics();

    // 2. Логика восстановления прогресса (только один раз при загрузке)
    if (initialProgress !== null) {
      const el = scrollerRef.current;
      const w = el.clientWidth;
      const scrollW = el.scrollWidth;
      const total = Math.max(
        1,
        Math.ceil((scrollW + COLUMN_GAP) / (w + COLUMN_GAP)),
      );

      let idx = Math.floor((initialProgress / 100) * total);
      if (initialProgress === 100) idx = total - 1;
      idx = clamp(idx, 0, total - 1);

      // Скроллим без анимации
      scrollToPage(idx, "auto");
      setInitialProgress(null);
    }

    const onResize = () => {
      updateMetrics();
      // При ресайзе "примагничиваемся" к текущей странице
      requestAnimationFrame(() => {
        if (scrollerRef.current) {
          const w = scrollerRef.current.clientWidth;
          const targetX = currentPage * (w + COLUMN_GAP);
          scrollerRef.current.scrollTo({ left: targetX, behavior: "auto" });
        }
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [htmlContent, fontSize, updateMetrics]);

  /* =========================
      Input Handlers
  ========================= */

  // Клавиатура
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable)
        return;

      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();

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

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentPage, totalPages]);

  // Выделение текста (Popup)
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const clearIfOutside = (evt) => {
      const pop = document.querySelector(".selection-ai-popover");
      if (pop && pop.contains(evt.target)) return;
      setSelectionUI((prev) => ({ ...prev, open: false }));
    };

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      const text = sel.toString().trim();
      if (!text) {
        setSelectionUI((prev) => ({ ...prev, open: false }));
        return;
      }

      // Проверяем, что выделение внутри читалки
      if (root.contains(sel.anchorNode)) {
        setSelectedText(text.slice(0, MAX_SELECTED));

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0) {
          setSelectionUI({
            open: true,
            x: rect.left + rect.width / 2,
            y: Math.max(12, rect.top - 10),
          });
        }
      }
    };

    root.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", clearIfOutside);

    return () => {
      root.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", clearIfOutside);
    };
  }, [htmlContent]);

  const openAiForAction = (action) => {
    setAiInitialAction(action);
    setAiAutoSend(Boolean(selectedText && selectedText.trim().length > 0));
    setAiOpen(true);
    setSelectionUI({ open: false, x: 0, y: 0 });
  };

  /* =========================
      Render
  ========================= */

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
          <div className="reader-header-actions"></div>
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
            onClick={() => setShowSettings((v) => !v)}
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
                className={theme === "light" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("light")}
              >
                <LightModeIcon fontSize="small" /> <span>Светлая</span>
              </button>
              <button
                className={theme === "sepia" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("sepia")}
              >
                <AutoAwesomeIcon fontSize="small" /> <span>Сепия</span>
              </button>
              <button
                className={theme === "dark" ? "active theme-btn" : "theme-btn"}
                onClick={() => setTheme("dark")}
              >
                <DarkModeIcon fontSize="small" /> <span>Темная</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="reader-viewport reader-viewport-paged" ref={containerRef}>
        <div className="reader-page">
          <div
            ref={scrollerRef}
            className="reader-content reader-content-paged"
            style={{
              fontSize: `${fontSize}px`,
              columnWidth: `${pageWidth}px`,
              columnGap: `${COLUMN_GAP}px`,
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {selectionUI.open && (
          <div
            className="selection-ai-popover"
            style={{ left: `${selectionUI.x}px`, top: `${selectionUI.y}px` }}
          >
            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("explain")}
            >
              <PsychologyIcon fontSize="small" /> <span>Объяснить</span>
            </button>
            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("translate")}
            >
              <TranslateIcon fontSize="small" /> <span>Перевод</span>
            </button>
            <button
              className="sel-ai-btn"
              onClick={() => openAiForAction("summarize")}
            >
              <SummarizeIcon fontSize="small" /> <span>Пересказ</span>
            </button>
            <button
              className="sel-ai-btn primary"
              onClick={() => openAiForAction("qa")}
            >
              <SmartToyIcon fontSize="small" /> <span>Чат</span>
            </button>
          </div>
        )}
      </div>

      <footer className="reader-footer">
        <button
          className="icon-btn nav-btn"
          onClick={goPrev}
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
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          className="icon-btn nav-btn"
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
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
