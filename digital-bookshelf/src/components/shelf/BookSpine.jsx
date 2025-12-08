// src/components/shelf/BookSpine.jsx

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookshelf.css";

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

const bookVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

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

  const semanticColor = coreBook.semanticColor;
  const coverUrl = coreBook.coverUrl;

  const style = useMemo(() => {
    const width = calculateWidth(pageCount);

    let backgroundColor;
    if (semanticColor) {
      backgroundColor = semanticColor;
    } else {
      const colorIndex = getColorIndex(bookId);
      backgroundColor = SPINE_COLORS[colorIndex];
    }

    const backgroundStyle = coverUrl
      ? {
          backgroundImage: `
            linear-gradient(
              to right, 
              rgba(0,0,0,0.4) 0%, 
              rgba(0,0,0,0.1) 8%, 
              rgba(0,0,0,0) 15%,
              rgba(0,0,0,0) 85%,
              rgba(0,0,0,0.1) 92%,
              rgba(0,0,0,0.4) 100%
            ),
            url(${coverUrl})
          `,
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }
      : {};

    return {
      width: `${width}px`,
      height: "160px",
      backgroundColor: backgroundColor,
      ...backgroundStyle,
    };
  }, [bookId, pageCount, semanticColor, coverUrl]);

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
      variants={bookVariants}
      whileHover={{
        y: -12,
        zIndex: 100,
        transition: { type: "spring", stiffness: 400, damping: 15 },
      }}
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
    </motion.div>
  );
};

export default BookSpine;
