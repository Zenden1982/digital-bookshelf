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
  currentTheme = "theme-light",
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
  const abortRef = useRef(null);

  useEffect(() => {
    setAction(initialAction || "qa");
  }, [initialAction]);

  // Автоскролл при открытии/сообщениях/стриминге
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
  }, [open, messages, loading]);

  // Остановить стрим, если Drawer закрыли
  useEffect(() => {
    if (open) return;
    try {
      abortRef.current?.abort?.();
    } catch (e) {
      // ignore
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [open]);

  // Авто-отправка при открытии
  useEffect(() => {
    if (!open) return;
    if (!autoSendOnOpen) return;
    if (autoSentRef.current) return;
    if (!selectedText || !selectedText.trim()) return;

    autoSentRef.current = true;
    send(initialAction, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSendOnOpen, selectedText, initialAction]);

  const quickHint = useMemo(() => {
    if (!selectedText) return "Выделите текст в книге для контекста.";
    return `Выделено символов: ${Math.min(selectedText.length, MAX_SELECTED)}`;
  }, [selectedText]);

  const buildPayload = (act, userMessage, nextMessages) => ({
    action: act,
    language,
    selectedText: trim(selectedText || "", MAX_SELECTED),
    userMessage: userMessage || "",
    history: (nextMessages || [])
      .slice(-10)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content })),
    model: DEFAULT_MODEL,
  });

  const send = async (overrideAction = null, overrideMessage = null) => {
    const userMessage = (overrideMessage ?? input).trim();
    const act = overrideAction ?? action;

    if (!selectedText && !userMessage) return;
    if (loading) return;

    // Если уже был стрим — прерываем
    try {
      abortRef.current?.abort?.();
    } catch (e) {
      // ignore
    }
    abortRef.current = null;

    let nextMessages = messages;

    // 1) Пишем сообщение пользователя (если есть)
    if (userMessage) {
      nextMessages = [...messages, { role: "user", content: userMessage }];
      setMessages(nextMessages);
    }

    // 2) Готовим пустой bubble ассистента (будем дописывать токены)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const payload = buildPayload(act, userMessage, nextMessages);

    // 3) Стримим
    const controller = new AbortController();
    abortRef.current = controller;

    await aiService.chatStream(payload, {
      signal: controller.signal,

      onToken: (fullText) => {
        setMessages((prev) => {
          if (!prev.length) return prev;
          const copy = [...prev];
          const lastIdx = copy.length - 1;

          if (copy[lastIdx]?.role !== "assistant") {
            copy.push({ role: "assistant", content: fullText });
            return copy;
          }

          copy[lastIdx] = { ...copy[lastIdx], content: fullText };
          return copy;
        });
      },

      onDone: () => {
        setLoading(false);
        abortRef.current = null;
      },

      onError: (e) => {
        // если это наш abort — ничего не показываем
        if (controller.signal.aborted) return;
        if (e?.name === "AbortError") return;

        setLoading(false);
        abortRef.current = null;

        setMessages((prev) => {
          if (!prev.length) return prev;
          const copy = [...prev];
          const lastIdx = copy.length - 1;

          const errText = `Ошибка: ${e?.message || "network error"}`;

          // Если последний assistant уже содержит ответ, лучше не затирать его ошибкой
          if (
            copy[lastIdx]?.role === "assistant" &&
            (copy[lastIdx].content || "").trim().length > 0
          ) {
            return [...copy, { role: "assistant", content: errText }];
          }

          // Иначе заменяем пустой bubble ошибкой
          if (copy[lastIdx]?.role === "assistant") {
            copy[lastIdx] = { ...copy[lastIdx], content: errText };
            return copy;
          }

          return [...copy, { role: "assistant", content: errText }];
        });
      },
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    // если идёт стрим — прервём
    try {
      abortRef.current?.abort?.();
    } catch (e) {
      // ignore
    } finally {
      abortRef.current = null;
      setLoading(false);
    }

    setMessages([
      {
        role: "assistant",
        content: "Чат очищен. Готов к работе.",
      },
    ]);
  };

  if (!open) return null;

  return (
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
            <button
              className="ai-icon-btn"
              onClick={() => {
                // при закрытии тоже прерываем стрим
                try {
                  abortRef.current?.abort?.();
                } catch (e) {
                  // ignore
                } finally {
                  abortRef.current = null;
                  setLoading(false);
                }
                onClose?.();
              }}
              title="Закрыть"
            >
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
            title="Отправить (Ctrl+Enter)"
          >
            <SendIcon />
          </button>
        </footer>
      </aside>
    </div>
  );
};

export default ReaderAiDrawer;
