// src/components/shelf/BookSpine.jsx

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookshelf.css";

// Палитра обложек
const SPINE_COLORS = [
  "#8B4513",
  "#2E4053",
  "#145A32",
  "#641E16",
  "#5B2C6F",
  "#7D6608",
  "#78281F",
  "#1A5276",
  "#B03A2E",
  "#117864",
];

function getColorIndex(bookId) {
  if (!bookId) return 0;
  const strId = String(bookId);
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % SPINE_COLORS.length);
}

function calculateWidth(pageCount) {
  if (!pageCount) return 32;
  const width = 24 + (Math.min(pageCount, 1000) / 1000) * 36;
  return Math.round(width);
}

const BookSpine = ({ book, onHover, onLeave }) => {
  const navigate = useNavigate();

  const coreBook = book.book || book;
  const bookId = coreBook.id || book.id;
  const pageCount = coreBook.pageCount || 200;
  const progress = book.progress || 0;
  const status = book.status;

  const style = useMemo(() => {
    const width = calculateWidth(pageCount);
    const colorIndex = getColorIndex(bookId);
    return {
      width: `${width}px`,
      height: "160px",
      backgroundColor: SPINE_COLORS[colorIndex],
    };
  }, [bookId, pageCount]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (bookId) {
      navigate(`/book/${bookId}`);
    }
  };

  return (
    <motion.div
      className="book-spine"
      style={style}
      onClick={handleClick}
      onMouseEnter={() => onHover && onHover(book)}
      onMouseLeave={onLeave}
      whileHover={{
        y: -12,
        zIndex: 100,
        transition: { type: "spring", stiffness: 400, damping: 15 },
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="spine-highlight" />

      {status === "READING" && progress > 0 && (
        <div className="spine-progress-track">
          <div
            className="spine-progress-fill"
            style={{ height: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {status === "FINISHED" && <div className="spine-finished-mark">✓</div>}
    </motion.div>
  );
};

export default BookSpine;
