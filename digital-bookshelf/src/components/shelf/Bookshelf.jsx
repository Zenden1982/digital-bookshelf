import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { shelfService } from "../../services/shelfService"; // Импортируем сервис для обновления
import BookSpine from "./BookSpine";
import "./Bookshelf.css";

// --- Animation Variants ---
const shelfRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// --- Helpers ---
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

// --- Draggable Book Component ---
const DraggableBook = ({ book, onHover, onLeave }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(book.id || book.book?.id),
      data: { book }, // Передаем данные книги
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : "auto",
    opacity: isDragging ? 0 : 1, // Скрываем оригинал при перетаскивании
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <BookSpine book={book} onHover={onHover} onLeave={onLeave} />
    </div>
  );
};

// --- Droppable Shelf Row ---
const ShelfRow = ({
  id,
  status,
  title,
  books,
  onHoverBook,
  onLeaveBook,
  isFirstRow,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status, // ID зоны дропа — это статус (READING, PLAN_TO_READ, FINISHED)
  });

  // Подсветка при наведении книгой
  const bgStyle = isOver
    ? {
        backgroundColor: "rgba(255, 215, 0, 0.15)",
        borderRadius: "8px",
        transition: "0.2s",
      }
    : {};

  return (
    <motion.div className="shelf-tier" variants={shelfRowVariants}>
      {isFirstRow && title && (
        <div className="shelf-label">
          <span className="label-text">{title}</span>
          <span className="label-count">{books ? books.length : 0}</span>
        </div>
      )}

      {/* Зона дропа */}
      <div ref={setNodeRef} className="books-container" style={bgStyle}>
        {books &&
          books.map((book) => (
            <DraggableBook
              key={book.id || book.book?.id}
              book={book}
              onHover={onHoverBook}
              onLeave={onLeaveBook}
            />
          ))}
      </div>

      <div className="wooden-board">
        <div className="board-shadow" />
      </div>
    </motion.div>
  );
};

// --- Main Component ---
const Bookshelf = ({ books = [], onHoverChange, onStatusChange }) => {
  const measureRef = useRef(null);
  const [booksPerRow, setBooksPerRow] = useState(14);
  const [activeBook, setActiveBook] = useState(null); // Для DragOverlay

  // Распределение книг
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

  // Пересчет ширины (Responsive)
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const calc = () => {
      const containerWidth = el.getBoundingClientRect().width;
      const paddingLeftRight = 24;
      const usable = Math.max(0, containerWidth - paddingLeftRight);
      setBooksPerRow(clamp(Math.floor(usable / 34), 5, 30)); // Упрощенный расчет
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [books.length]);

  const readingRows = chunkBooks(reading, booksPerRow);
  const plannedRows = chunkBooks(planned, booksPerRow);
  const finishedRows = chunkBooks(finished, booksPerRow);

  // --- DnD Handlers ---

  const handleDragStart = (event) => {
    setActiveBook(event.active.data.current.book);
    onHoverChange?.(null); // Скрываем тултип при начале драга
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveBook(null);

    if (!over) return; // Бросили мимо полки

    const bookId = active.id;
    const newStatus = over.id; // ID зоны дропа (READING, etc.)
    const currentBook = active.data.current.book;

    // Если статус изменился
    if (currentBook.status !== newStatus) {
      console.log(`Moving book ${bookId} to ${newStatus}`);

      // 1. Вызываем колбэк родителя для оптимистичного UI (если есть)
      if (onStatusChange) {
        onStatusChange(bookId, newStatus);
      } else {
        // Или обновляем напрямую, если родитель не управляет стейтом
        try {
          await shelfService.updateUserBookStatus(bookId, newStatus);
          window.location.reload(); // Простой способ обновить данные, лучше через стейт
        } catch (e) {
          console.error("Failed to move book", e);
        }
      }
    }
  };

  if (!books || books.length === 0) {
    return (
      <div className="bookshelf-wrapper">
        <div className="empty-shelf-message">Полка пуста...</div>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bookshelf-wrapper arch-library">
        <div className="cabinet-frame">
          <div className="cabinet-top">
            <div className="cornice-detail" />
          </div>

          <div className="cabinet-body">
            <div className="cabinet-side left" />
            <div className="cabinet-side right" />

            <div ref={measureRef} className="cabinet-content">
              {/* Полки "Читаю" */}
              {readingRows.length > 0 ? (
                readingRows.map((chunk, i) => (
                  <ShelfRow
                    key={`reading-${i}`}
                    status="READING"
                    title="Читаю сейчас"
                    isFirstRow={i === 0}
                    books={chunk}
                    onHoverBook={onHoverChange}
                    onLeaveBook={() => onHoverChange(null)}
                  />
                ))
              ) : (
                // Пустая полка, чтобы можно было перетащить в "Читаю" даже если там пусто
                <ShelfRow
                  status="READING"
                  title="Читаю сейчас"
                  isFirstRow={true}
                  books={[]}
                />
              )}

              {/* Полки "В планах" */}
              {plannedRows.length > 0 ? (
                plannedRows.map((chunk, i) => (
                  <ShelfRow
                    key={`planned-${i}`}
                    status="PLAN_TO_READ"
                    title="В планах"
                    isFirstRow={i === 0}
                    books={chunk}
                    onHoverBook={onHoverChange}
                    onLeaveBook={() => onHoverChange(null)}
                  />
                ))
              ) : (
                <ShelfRow
                  status="PLAN_TO_READ"
                  title="В планах"
                  isFirstRow={true}
                  books={[]}
                />
              )}

              {/* Полки "Прочитано" */}
              {finishedRows.length > 0 ? (
                finishedRows.map((chunk, i) => (
                  <ShelfRow
                    key={`finished-${i}`}
                    status="FINISHED"
                    title="Прочитано"
                    isFirstRow={i === 0}
                    books={chunk}
                    onHoverBook={onHoverChange}
                    onLeaveBook={() => onHoverChange(null)}
                  />
                ))
              ) : (
                <ShelfRow
                  status="FINISHED"
                  title="Прочитано"
                  isFirstRow={true}
                  books={[]}
                />
              )}
            </div>
          </div>

          <div className="cabinet-base">
            <div className="base-detail" />
          </div>
        </div>
      </div>

      {/* Оверлей перетаскивания (то, что летит за курсором) */}
      <DragOverlay>
        {activeBook ? (
          <div style={{ transform: "rotate(5deg)" }}>
            <BookSpine book={activeBook} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Bookshelf;
