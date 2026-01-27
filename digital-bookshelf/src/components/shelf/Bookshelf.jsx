import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import BookSpine from "./BookSpine";
import "./Bookshelf.css";

const booksContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.05 },
  },
};

const shelfContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.3 },
  },
};

const shelfRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const chunkBooks = (books, size) => {
  if (!books) return [];
  const s = Math.max(1, size || 1);
  const chunks = [];
  for (let i = 0; i < books.length; i += s) {
    chunks.push(books.slice(i, i + s));
  }
  return chunks;
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const ShelfRow = ({ title, books, onHoverBook, onLeaveBook, isFirstRow }) => {
  if (!books || books.length === 0) return null;

  return (
    <motion.div className="shelf-tier" variants={shelfRowVariants}>
      {isFirstRow && title && (
        <div className="shelf-label">
          <span className="label-text">{title}</span>
          <span className="label-count">{books.length}</span>
        </div>
      )}

      <motion.div
        className="books-container"
        variants={booksContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {books.map((book) => (
          <BookSpine
            key={book.id || book.book?.id}
            book={book}
            onHover={onHoverBook}
            onLeave={onLeaveBook}
          />
        ))}
      </motion.div>

      <div className="wooden-board">
        <div className="board-shadow" />
      </div>
    </motion.div>
  );
};

const Bookshelf = ({ books = [], onHoverChange }) => {
  // ref на реальный контейнер, внутри которого уже есть .book-spine
  const measureRef = useRef(null);

  const [booksPerRow, setBooksPerRow] = useState(14);

  // делим книги по статусам
  const reading = useMemo(
    () => books.filter((b) => b.status === "READING"),
    [books],
  );
  const planned = useMemo(
    () => books.filter((b) => b.status === "PLAN_TO_READ"),
    [books],
  );
  const finished = useMemo(
    () => books.filter((b) => b.status === "FINISHED"),
    [books],
  );

  // пересчёт booksPerRow по реальным DOM-ширинам корешков
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const calc = () => {
      const containerWidth = el.getBoundingClientRect().width;

      // у .books-container padding: 0 12px, это влияет на реальную “полезную” ширину
      const paddingLeftRight = 24;
      const usable = Math.max(0, containerWidth - paddingLeftRight);

      // измеряем реальные корешки
      const spines = el.querySelectorAll(".book-spine");

      // если пока нет DOM (например, пустая полка) — fallback
      if (!spines || spines.length === 0) {
        setBooksPerRow(14);
        return;
      }

      // берём первые N корешков, чтобы было быстро
      const N = Math.min(spines.length, 24);
      const widths = [];
      for (let i = 0; i < N; i++) {
        const w = spines[i].getBoundingClientRect().width;
        if (w > 0) widths.push(w);
      }

      if (widths.length === 0) {
        setBooksPerRow(14);
        return;
      }

      widths.sort((a, b) => a - b);
      const median = widths[Math.floor(widths.length / 2)];

      // gap в .books-container = 2px
      const gap = 2;

      const perRow = Math.floor(usable / (median + gap));

      // ограничения, чтобы не было 1–2 книги в ряд и чтобы не разъезжалось на широких экранах
      setBooksPerRow(clamp(perRow, 5, 30));
    };

    // 1) сразу после рендера
    const raf = requestAnimationFrame(calc);

    // 2) при изменениях размера контейнера
    const ro = new ResizeObserver(() => calc());
    ro.observe(el);

    // 3) на всякий случай при resize окна
    window.addEventListener("resize", calc);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, [books, reading.length, planned.length, finished.length]);

  const readingRows = useMemo(
    () => chunkBooks(reading, booksPerRow),
    [reading, booksPerRow],
  );
  const plannedRows = useMemo(
    () => chunkBooks(planned, booksPerRow),
    [planned, booksPerRow],
  );
  const finishedRows = useMemo(
    () => chunkBooks(finished, booksPerRow),
    [finished, booksPerRow],
  );

  const handleHover = (book) => onHoverChange?.(book);
  const handleLeave = () => onHoverChange?.(null);

  if (!books || books.length === 0) {
    return (
      <div className="bookshelf-wrapper">
        <div className="empty-shelf-message">Полка пуста...</div>
      </div>
    );
  }

  return (
    <div className="bookshelf-wrapper arch-library">
      <div className="cabinet-frame">
        <div className="cabinet-top">
          <div className="cornice-detail" />
        </div>

        <div className="cabinet-body">
          <div className="cabinet-side left" />
          <div className="cabinet-side right" />

          <motion.div
            ref={measureRef}
            className="cabinet-content"
            variants={shelfContentVariants}
            initial="hidden"
            animate="visible"
          >
            {readingRows.map((chunk, i) => (
              <ShelfRow
                key={`reading-${i}`}
                title="Читаю сейчас"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}

            {plannedRows.map((chunk, i) => (
              <ShelfRow
                key={`planned-${i}`}
                title="В планах"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}

            {finishedRows.map((chunk, i) => (
              <ShelfRow
                key={`finished-${i}`}
                title="Прочитано"
                isFirstRow={i === 0}
                books={chunk}
                onHoverBook={handleHover}
                onLeaveBook={handleLeave}
              />
            ))}
          </motion.div>
        </div>

        <div className="cabinet-base">
          <div className="base-detail" />
        </div>
      </div>
    </div>
  );
};

export default Bookshelf;
