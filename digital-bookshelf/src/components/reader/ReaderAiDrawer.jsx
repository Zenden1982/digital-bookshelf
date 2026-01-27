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
  initialAction = "qa", // <- новое
  autoSendOnOpen = false, // <- новое
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
    // если извне сменили initialAction — применим
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

  useEffect(() => {
    // авто-отправка при открытии (только один раз на открытие)
    if (!open) return;
    if (!autoSendOnOpen) return;
    if (autoSentRef.current) return;

    // если нет выделения — не отправляем
    if (!selectedText || !selectedText.trim()) return;

    autoSentRef.current = true;

    // Отправим пустой userMessage, чтобы сработал systemPrompt+selectedText
    send(initialAction, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSendOnOpen, selectedText, initialAction]);

  const quickHint = useMemo(() => {
    if (!selectedText) return "Выдели текст в книге, чтобы я работал точнее.";
    return `Выделено: ${Math.min(selectedText.length, MAX_SELECTED)} символов`;
  }, [selectedText]);

  const send = async (overrideAction = null, overrideMessage = null) => {
    const userMessage = (overrideMessage ?? input).trim();
    const act = overrideAction ?? action;

    // можно отправить и без userMessage, если есть selectedText
    if (!selectedText && !userMessage) return;

    let nextMessages = messages;

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
        userMessage: userMessage || "",
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
        content:
          "Чат очищен. Выдели фрагмент и попроси перевод, объяснение или пересказ.",
      },
    ]);
  };

  if (!open) return null;

  return (
    <div className="ai-drawer-backdrop" onClick={onClose}>
      <aside className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="ai-drawer-header">
          <div className="ai-title">
            <SmartToyIcon />
            <div className="ai-title-text">
              <div className="ai-title-main">AI помощник</div>
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
              title="Перевод"
            >
              <TranslateIcon fontSize="small" /> Перевод
            </button>
            <button
              className={`ai-chip ${action === "explain" ? "active" : ""}`}
              onClick={() => setAction("explain")}
              disabled={loading}
              title="Объяснение"
            >
              <PsychologyIcon fontSize="small" /> Объяснить
            </button>
            <button
              className={`ai-chip ${action === "summarize" ? "active" : ""}`}
              onClick={() => setAction("summarize")}
              disabled={loading}
              title="Пересказ"
            >
              <SummarizeIcon fontSize="small" /> Пересказ
            </button>
            <button
              className={`ai-chip ${action === "qa" ? "active" : ""}`}
              onClick={() => setAction("qa")}
              disabled={loading}
              title="Вопрос"
            >
              <SmartToyIcon fontSize="small" /> Вопрос
            </button>

            <select
              className="ai-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
              title="Язык ответа"
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
        </div>

        <footer className="ai-input">
          <textarea
            className="ai-textarea"
            placeholder={
              selectedText
                ? "Напиши вопрос (Ctrl+Enter отправить). Например: «Объясни смысл»"
                : "Сначала выдели фрагмент в тексте (или просто задай общий вопрос)."
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
