// src/services/aiService.js
import api from "./api";

const STREAM_URL = "/api/v1/ai/chat/stream";

export const aiService = {
  chat: async (payload) => {
    const res = await api.post("/ai/chat", payload);
    return res.data; // { answer }
  },

  chatStream: async (payload, { onToken, onDone, onError, signal } = {}) => {
    let receivedAny = false;
    let doneSeen = false;

    try {
      const token = storage.getToken(); // Получаем токен
      const headers = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };

      // Если токен есть — добавляем заголовок
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(STREAM_URL, {
        method: "POST",
        headers: headers, // Используем наш объект с заголовками
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) throw new Error(`Stream failed: ${res.status}`);
      if (!res.body) throw new Error("No response body (stream not supported)");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const rawEvents = buffer.split("\n\n");
        buffer = rawEvents.pop() || "";

        for (const rawEvent of rawEvents) {
          const lines = rawEvent.split("\n");
          const dataParts = [];

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            const part = line.startsWith("data: ")
              ? line.slice(6)
              : line.slice(5);
            dataParts.push(part);
          }

          if (!dataParts.length) continue;

          let data = dataParts.join("\n").replace(/\\n/g, "\n");

          if (data === "[DONE]") {
            doneSeen = true;
            onDone?.();
            return;
          }

          receivedAny = true;
          onToken?.(data);
        }
      }

      onDone?.();
    } catch (e) {
      // Отмены не показываем
      if (e?.name === "AbortError") return;

      // Ключевой момент: если уже что-то получили или уже видели DONE,
      // то "network error" в конце считаем нормальным завершением
      if (receivedAny || doneSeen) {
        onDone?.();
        return;
      }

      onError?.(e);
    }
  },
};

export default aiService;
