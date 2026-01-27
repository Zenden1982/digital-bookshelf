package com.diplom.diplom.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.diplom.diplom.Entity.DTO.AiChatRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OllamaService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    public Map<String, Object> chat(AiChatRequest req) {
        // Системный промпт под действия:
        String system = buildSystemPrompt(req.action(), req.language());

        // Формируем сообщения для Ollama /api/chat
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));

        if (req.selectedText() != null && !req.selectedText().isBlank()) {
            messages.add(Map.of(
                    "role", "user",
                    "content", "Выделенный фрагмент:\n" + req.selectedText()));
        }

        if (req.history() != null) {
            for (var m : req.history()) {
                messages.add(Map.of("role", m.role(), "content", m.content()));
            }
        }

        if (req.userMessage() != null && !req.userMessage().isBlank()) {
            messages.add(Map.of("role", "user", "content", req.userMessage()));
        }

        Map<String, Object> body = Map.of(
                "model", req.model() == null ? "llama3.1" : req.model(),
                "messages", messages,
                "stream", false);

        String url = ollamaUrl + "/api/chat";
        return restTemplate.postForObject(url, body, Map.class);
    }

    private String buildSystemPrompt(String action, String language) {
        String lang = (language == null || language.isBlank()) ? "ru" : language;

        return switch (action == null ? "" : action) {
            case "translate" ->
                "Ты помощник-переводчик. Переводи точно, сохраняя смысл и стиль. Ответ на языке: " + lang + ".";
            case "summarize" ->
                "Ты помощник по чтению. Дай краткий пересказ, затем список ключевых мыслей. Ответ на языке: " + lang
                        + ".";
            case "explain" ->
                "Ты объясняешь текст простыми словами, приводишь примеры и объясняешь термины. Ответ на языке: " + lang
                        + ".";
            default -> "Ты помощник по чтению: отвечай по выделенному фрагменту, не выдумывай факты. Ответ на языке: "
                    + lang + ".";
        };
    }
}
