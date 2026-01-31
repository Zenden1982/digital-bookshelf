// src/components/ai/ReaderAiDrawer.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { aiService } from "../../services/aiService";

import CloseIcon from "@mui/icons-material/Close";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SummarizeIcon from "@mui/icons-material/Summarize";
import TranslateIcon from "@mui/icons-material/Translate";

import "./ReaderAiDrawer.css";

const DEFAULT_MODEL = "llama3.1";
const MAX_SELECTED = 6000;

const trim = (s, max) => (s && s.length > max ? s.slice(0, max) : s);

const ReaderAiDrawer = ({
  open,
  onClose,
  selectedText,
  bookTitle,
  initialAction = "qa",
  autoSendOnOpen = false,
  currentTheme = "theme-light", // <-- Принимаем тему для стилизации
}) => {
  const [input, setInput] = useState("");
  const [action, setAction] = useState(initialAction);
  const [language, setLanguage] = useState("ru");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Я помощник по чтению. Выдели фрагмент и попроси перевод, объяснение или пересказ.",
    },
  ]);

  const listRef = useRef(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    setAction(initialAction || "qa");
  }, [initialAction]);

  useEffect(() => {
    if (!open) {
      autoSentRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [open, messages]);

  // Авто-отправка при открытии
  useEffect(() => {
    if (!open) return;
    if (!autoSendOnOpen) return;
    if (autoSentRef.current) return;
    if (!selectedText || !selectedText.trim()) return;

    autoSentRef.current = true;
    send(initialAction, ""); // Отправляем без сообщения пользователя
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSendOnOpen, selectedText, initialAction]);

  const quickHint = useMemo(() => {
    if (!selectedText) return "Выделите текст в книге для контекста.";
    return `Выделено символов: ${Math.min(selectedText.length, MAX_SELECTED)}`;
  }, [selectedText]);

  const send = async (overrideAction = null, overrideMessage = null) => {
    const userMessage = (overrideMessage ?? input).trim();
    const act = overrideAction ?? action;

    // Не отправляем, если нет ни текста, ни сообщения
    if (!selectedText && !userMessage) return;

    let nextMessages = messages;

    // Если пользователь написал сообщение — добавляем в чат
    if (userMessage) {
      nextMessages = [...messages, { role: "user", content: userMessage }];
      setMessages(nextMessages);
    }

    setLoading(true);
    try {
      const payload = {
        action: act,
        language,
        selectedText: trim(selectedText || "", MAX_SELECTED),
        userMessage: userMessage || "", // Сервер должен сам обработать пустое сообщение
        history: nextMessages
          .slice(-10)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        model: DEFAULT_MODEL,
      };

      const res = await aiService.chat(payload);
      const answer = res?.answer || "Пустой ответ от модели.";

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setInput("");
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Ошибка: ${e.message || "не удалось получить ответ"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Чат очищен. Готов к работе.",
      },
    ]);
  };

  if (!open) return null;

  return (
    // УБРАН onClick={onClose} с фона, чтобы можно было кликать мимо
    // Добавлен класс темы, чтобы переменные CSS работали внутри (т.к. position: fixed)
    <div className={`ai-drawer-backdrop ${currentTheme}`}>
      <aside className="ai-drawer">
        <header className="ai-drawer-header">
          <div className="ai-title">
            <SmartToyIcon />
            <div className="ai-title-text">
              <div className="ai-title-main">AI Помощник</div>
              <div className="ai-title-sub">{bookTitle || "Читалка"}</div>
            </div>
          </div>

          <div className="ai-header-actions">
            <button
              className="ai-icon-btn"
              onClick={clearChat}
              title="Очистить чат"
              disabled={loading}
            >
              <DeleteOutlineIcon />
            </button>
            <button className="ai-icon-btn" onClick={onClose} title="Закрыть">
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="ai-meta">
          <div className={`ai-selection ${selectedText ? "has" : ""}`}>
            <ContentPasteSearchIcon fontSize="small" />
            <span>{quickHint}</span>
          </div>

          <div className="ai-actions-row">
            <button
              className={`ai-chip ${action === "translate" ? "active" : ""}`}
              onClick={() => setAction("translate")}
              disabled={loading}
            >
              <TranslateIcon fontSize="small" /> Перевод
            </button>
            <button
              className={`ai-chip ${action === "explain" ? "active" : ""}`}
              onClick={() => setAction("explain")}
              disabled={loading}
            >
              <PsychologyIcon fontSize="small" /> Объяснить
            </button>
            <button
              className={`ai-chip ${action === "summarize" ? "active" : ""}`}
              onClick={() => setAction("summarize")}
              disabled={loading}
            >
              <SummarizeIcon fontSize="small" /> Пересказ
            </button>
            <button
              className={`ai-chip ${action === "qa" ? "active" : ""}`}
              onClick={() => setAction("qa")}
              disabled={loading}
            >
              <SmartToyIcon fontSize="small" /> Вопрос
            </button>

            <select
              className="ai-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="ru">RU</option>
              <option value="en">EN</option>
            </select>
          </div>
        </div>

        <div className="ai-messages" ref={listRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`ai-msg ${m.role}`}>
              <div className="ai-bubble">{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className="ai-msg assistant">
              <div
                className="ai-bubble ai-bubble-typing"
                aria-label="AI печатает"
              >
                <span className="typing-dots" aria-hidden="true">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </span>
              </div>
            </div>
          )}
        </div>

        <footer className="ai-input">
          <textarea
            className="ai-textarea"
            placeholder={
              selectedText
                ? "Задайте вопрос по выделенному... (Ctrl+Enter)"
                : "Выделите текст или напишите вопрос..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />

          <button
            className="ai-send-btn"
            onClick={() => send()}
            disabled={loading}
          >
            <SendIcon />
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default ReaderAiDrawer;
