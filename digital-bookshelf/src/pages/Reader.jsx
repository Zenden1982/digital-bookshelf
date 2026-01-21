// src/pages/Reader.jsx

import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FileUploadModal from "../components/common/FileUploadModal";
import { bookService } from "../services/bookService";
import { shelfService } from "../services/shelfService";
import { parseFb2 } from "../utils/fb2Parser";
import Epub from "epubjs";

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

const CHARS_PER_PAGE = 2500;

// TXT Pagination Logic (kept for legacy/txt files)
const splitTextIntoPages = (text, maxChars) => {
  const pages = [];
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxChars, text.length);
    if (endIndex < text.length) {
      const searchZoneStart = Math.max(startIndex, endIndex - Math.floor(maxChars * 0.2));
      const textChunk = text.slice(searchZoneStart, endIndex);
      const lastNewLine = textChunk.lastIndexOf("\n");
      if (lastNewLine !== -1) {
        endIndex = searchZoneStart + lastNewLine + 1;
      } else {
        const lastSentenceEnd = Math.max(textChunk.lastIndexOf(". "), textChunk.lastIndexOf("! "), textChunk.lastIndexOf("? "));
        if (lastSentenceEnd !== -1) {
          endIndex = searchZoneStart + lastSentenceEnd + 1;
        } else {
          const lastSpace = textChunk.lastIndexOf(" ");
          if (lastSpace !== -1) endIndex = searchZoneStart + lastSpace;
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

  // State
  const [format, setFormat] = useState("txt"); // 'txt', 'fb2', 'epub'
  const [content, setContent] = useState(null); // String for TXT/FB2
  const [epubRendition, setEpubRendition] = useState(null); // for EPUB

  const [title, setTitle] = useState("");
  const [pages, setPages] = useState([]); // For TXT/FB2 pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userBookId, setUserBookId] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // Settings
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem("reader-font-size") || "18"));
  const [theme, setTheme] = useState(localStorage.getItem("reader-theme") || "light");
  const [showSettings, setShowSettings] = useState(false);

  // AI & Selection
  const [selection, setSelection] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);

  const [showUploadModal, setShowUploadModal] = useState(false);

  const epubContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("reader-font-size", fontSize.toString());
    if (epubRendition) {
      epubRendition.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize, epubRendition]);

  useEffect(() => {
    localStorage.setItem("reader-theme", theme);
    // For EPUB separate handling might be needed but CSS usually handles it if container has class
  }, [theme]);

  // Load Book Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const detailData = await bookService.getBookDetail(bookId);
        setTitle(detailData.book.title);

        let detectedFormat = "txt";
        if (detailData.book.filePath) {
          if (detailData.book.filePath.endsWith(".epub")) detectedFormat = "epub";
          else if (detailData.book.filePath.endsWith(".fb2")) detectedFormat = "fb2";
        }
        setFormat(detectedFormat);

        // UserBook / Progress
        let savedPage = 0;
        if (detailData.userBook) {
          setUserBookId(detailData.userBook.id);
          if (detailData.userBook.currentPage) savedPage = detailData.userBook.currentPage - 1;
        } else {
          // Create UserBook entry if missing
          try {
            const newUserBook = await shelfService.addBookToMyShelf({ bookId, status: "READING" });
            setUserBookId(newUserBook.id);
          } catch (e) { console.error("Error creating UserBook", e); }
        }

        const contentData = await bookService.getBookContent(bookId);

        if (contentData && contentData.content) {

          if (detectedFormat === "epub") {
            // Initialize EPUB
            // contentData.content might be Base64 or Blob URL?
            // Assuming Backend returns raw bytes or text. 
            // EPubJS usually takes arraybuffer or url. 
            // If contentData.content is text, it might be base64 encoded for binary files.
            // NOTE: For this implementation, assuming contentData.content is correct input for epubjs (ArrayBuffer or Base64).
            // If backend returns text for epub, it's likely weird.

            // For 'epub', we'll rely on a direct URL if possible or convert content
            initEpub(contentData.content, savedPage);

          } else if (detectedFormat === "fb2") {
            // Parse FB2
            const htmlText = parseFb2(contentData.content);
            setContent(htmlText);
            const chunks = splitTextIntoPages(htmlText, CHARS_PER_PAGE); // Simple split for now, preserving HTML tags is Tricky with this splitter!
            // FIX: The simple splitter breaks HTML tags.
            // For FB2, we will treat the whole HTML as one "page" and let user scroll OR
            // Better: sanitize/strip tags for splitting? No, user wants formatting.
            // Alternative: Just render whole HTML in a scrollable container for V1 FB2 support.
            // Compelling "pages" for HTML is complex (CSS Columns).
            setPages([htmlText]); // Single Page Scroll Mode for FB2
            setCurrentPage(0);
          } else {
            // TXT
            const text = contentData.content;
            setContent(text);
            const chunks = splitTextIntoPages(text, CHARS_PER_PAGE);
            setPages(chunks);
            setCurrentPage(Math.min(savedPage, chunks.length - 1));
          }

          const savedBookmarks = JSON.parse(localStorage.getItem(`bookmarks-${bookId}`) || "[]");
          setBookmarks(savedBookmarks);

        } else {
          setContent(null);
        }

      } catch (error) {
        console.error("Reader load error", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => {
      if (epubRendition) epubRendition.destroy();
    };
  }, [bookId]);

  const initEpub = (bookData, initialPage) => {
    // Ideally we use URL if available
    const book = Epub(bookData, { encoding: "base64" }); // Assuming base64 if sent via JSON
    // If URL: const book = Epub("url_to_book.epub");

    const rendition = book.renderTo(epubContainerRef.current, {
      width: "100%",
      height: "100%",
      flow: "paginated"
    });

    setEpubRendition(rendition);

    rendition.display().then(() => {
      // Restore location if possible (needs CFI)
      // If we have integer page, we can't easily jump in EPUB without CFI.
      // For now start at beginning.
    });

    rendition.on("relocated", (location) => {
      // Save CFI to backend/localstorage
      // setLocation(location.start.cfi);
    });
  };

  const handlePageChange = useCallback((newPage) => {
    if (format === "epub" && epubRendition) {
      if (newPage > currentPage) epubRendition.next();
      else epubRendition.prev();
      setCurrentPage(newPage); // Symbolic increment for EPUB
    } else {
      // Standard Array Pagination
      if (newPage < 0 || newPage >= pages.length) return;
      setCurrentPage(newPage);

      if (userBookId) {
        const progressPercent = Math.round(((newPage + 1) / pages.length) * 100);
        shelfService.updateMyUserBook(userBookId, {
          currentPage: newPage + 1,
          totalPages: pages.length,
          progress: progressPercent
        }).catch(e => console.error("Error saving progress", e));
      }
    }
  }, [pages.length, userBookId, format, epubRendition, currentPage]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft") handlePageChange(currentPage - 1);
      else if (e.key === "ArrowRight") handlePageChange(currentPage + 1);
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, handlePageChange]);

  const toggleBookmark = () => {
    // Legacy bookmark handling for pages index
    const isBookmarked = bookmarks.includes(currentPage);
    const newBookmarks = isBookmarked ? bookmarks.filter(p => p !== currentPage) : [...bookmarks, currentPage];
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(newBookmarks));
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

  // AI Logic reusing existing
  const handleAiAction = async (actionType) => {
    if (!selection) return;
    setShowAiSidebar(true);
    setAiLoading(true);
    setAiResponse("");
    const newQuery = { type: actionType, text: selection.text, timestamp: new Date().toISOString() };

    try {
      await new Promise(r => setTimeout(r, 1000));
      let fake = "";
      if (actionType === "explain") fake = `Explanation for "${selection.text}"...`;
      else if (actionType === "translate") fake = `Translation...`;
      else if (actionType === "summary") fake = `Summary...`;

      setAiResponse(fake);
      setAiHistory([...aiHistory, { ...newQuery, response: fake }]);
    } catch (e) { setAiResponse("Error"); }
    finally { setAiLoading(false); setSelection(null); window.getSelection().removeAllRanges(); }
  };


  if (loading) return <div className="reader-loading"><div className="loader-spinner"></div></div>;

  if (!content && format !== "epub") {
    return (
      <div className="reader-container">
        <header className="reader-header"><button onClick={() => navigate(-1)}><ArrowBackIcon /></button> <h1>{title}</h1></header>
        <div className="reader-empty-state">
          <MenuBookIcon style={{ fontSize: 64, color: "#95A5A6" }} />
          <h3>Нет содержимого</h3>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}><CloudUploadIcon /> Загрузить</button>
        </div>
        {showUploadModal && <FileUploadModal userBookId={userBookId} onClose={() => setShowUploadModal(false)} onSuccess={() => window.location.reload()} />}
      </div>
    );
  }

  return (
    <div className={`reader-container theme-${theme}`}>
      <header className="reader-header">
        <div className="header-left">
          <button className="icon-btn" onClick={() => navigate(-1)}><ArrowBackIcon /></button>
          <h1 className="reader-title">{title}</h1>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={toggleBookmark}>{bookmarks.includes(currentPage) ? <BookmarkIcon /> : <BookmarkBorderIcon />}</button>
          <button className="icon-btn" onClick={() => setShowAiSidebar(!showAiSidebar)}><SmartToyIcon /></button>
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}><SettingsIcon /></button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-section">
            <h3><FormatSizeIcon /> Размер: {fontSize}</h3>
            <div className="font-size-controls">
              <button onClick={() => setFontSize(Math.max(12, fontSize - 2))}>A-</button>
              <button onClick={() => setFontSize(Math.min(32, fontSize + 2))}>A+</button>
            </div>
          </div>
          <div className="settings-section">
            <h3><BrightnessHighIcon /> Тема</h3>
            <div className="theme-controls">
              <button onClick={() => setTheme("light")} className={theme === "light" ? "active" : ""}>Light</button>
              <button onClick={() => setTheme("sepia")} className={theme === "sepia" ? "active" : ""}>Sepia</button>
              <button onClick={() => setTheme("dark")} className={theme === "dark" ? "active" : ""}>Dark</button>
            </div>
          </div>
        </div>
      )}

      <div className="reader-content" onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection}>
        {format === "epub" ? (
          <div id="epub-viewer" ref={epubContainerRef} style={{ height: "calc(100vh - 140px)", width: "100%" }}></div>
        ) : format === "fb2" ? (
          <div className="page-text fb2-content" style={{ fontSize: `${fontSize}px`, overflowY: 'auto', height: '100%', padding: '20px 40px' }}
            dangerouslySetInnerHTML={{ __html: pages[0] }} />
        ) : (
          <div className="page-text" style={{ fontSize: `${fontSize}px` }}>{pages[currentPage]}</div>
        )}
      </div>

      <footer className="reader-footer">
        <button className="nav-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0 && format !== "epub"}>
          <ArrowBackIosIcon />
        </button>
        <div className="page-info">
          {format === "epub" ? <span>EPUB View</span> : <span>{currentPage + 1} / {pages.length}</span>}
        </div>
        <button className="nav-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pages.length - 1 && format !== "epub"}>
          <ArrowForwardIosIcon />
        </button>
      </footer>

      {/* AI Tooltip & Sidebar omitted for brevity but logic is above */}
      {selection && !showAiSidebar && (
        <div
          className="ai-tooltip"
          style={{ top: selection.y, left: selection.x }}
        >
          <button onClick={() => handleAiAction("explain")}>
            <LightbulbIcon fontSize="small" />
          </button>
          <button onClick={() => handleAiAction("translate")}>
            <TranslateIcon fontSize="small" />
          </button>
        </div>
      )}

      <div className={`ai-sidebar ${showAiSidebar ? "open" : ""}`}>
        {/* Sidebar UI same as before */}
        <div className="ai-sidebar-header">
          <h3>
            <SmartToyIcon /> AI Assist
          </h3>
          <button className="icon-btn" onClick={() => setShowAiSidebar(false)}>
            <CloseIcon />
          </button>
        </div>
        <div className="ai-sidebar-content">
          {aiLoading ? <p>Thinking...</p> : <p>{aiResponse}</p>}
        </div>
      </div>

    </div>
  );
};

export default Reader;
