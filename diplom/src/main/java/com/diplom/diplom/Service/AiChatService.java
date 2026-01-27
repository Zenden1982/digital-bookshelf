package com.diplom.diplom.Service;

import java.util.Locale;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.DTO.AiChatRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ChatClient chatClient;

    public String chat(AiChatRequest req) {
        String systemPrompt = buildSystemPrompt(req.action(), req.language());

        ChatClient.ChatClientRequestSpec spec = chatClient
                .prompt()
                .messages(new SystemMessage(systemPrompt));

        if (req.selectedText() != null && !req.selectedText().isBlank()) {
            spec = spec.messages(new UserMessage("Текст:\n" + trim(req.selectedText(), 6000)));
        }

        if (req.history() != null) {
            for (var m : req.history()) {
                String role = m.role() == null ? "" : m.role().toLowerCase(Locale.ROOT);
                if ("assistant".equals(role))
                    spec = spec.messages(new AssistantMessage(m.content()));
                if ("user".equals(role))
                    spec = spec.messages(new UserMessage(m.content()));
            }
        }

        if (req.userMessage() != null && !req.userMessage().isBlank()) {
            spec = spec.messages(new UserMessage(req.userMessage()));
        }

        return spec.call().content();
    }

    private String buildSystemPrompt(String action, String language) {
        String lang = (language == null || language.isBlank()) ? "ru" : language;

        return switch (action == null ? "" : action) {
            case "translate" ->
                "Ты переводчик. Переведи текст точно, сохрани стиль. Ответ на языке: " + lang + ".";
            case "summarize" ->
                "Ты помощник по чтению. Сделай краткий пересказ текста и 5 тезисов. Ответ на языке: " + lang + ".";
            case "explain" ->
                "Ты объясняешь текст простыми словами, даёшь примеры и объясняешь термины. Ответ на языке: " + lang
                        + ".";
            default ->
                "Ты помощник по чтению. Отвечай строго по тексту и вопросу, не выдумывай. Ответ на языке: " + lang
                        + ".";
        };
    }

    private String trim(String s, int max) {
        if (s == null)
            return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
