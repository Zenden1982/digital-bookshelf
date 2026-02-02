package com.diplom.diplom.Service;

import java.time.Duration;
import java.util.Locale;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.DTO.AiChatRequest;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ChatClient chatClient;

    public Flux<ServerSentEvent<String>> chatStream(AiChatRequest req) {
        Flux<String> tokens = buildSpec(req).stream().content();

        Flux<String> cumulative = tokens
                .scan(new StringBuilder(), (sb, t) -> sb.append(t))
                .skip(1) // первый элемент scan() — пустой StringBuilder
                .map(StringBuilder::toString);

        // чтобы не слать 1000 событий в секунду — ограничим частоту
        Flux<String> throttled = cumulative
                .sample(Duration.ofMillis(40))
                .concatWith(cumulative.takeLast(1)); // гарантируем финальный полный текст

        return throttled
                .map(text -> ServerSentEvent.<String>builder(text).event("partial").build())
                .concatWithValues(ServerSentEvent.<String>builder("[DONE]").event("done").build());
    }

    public String chat(AiChatRequest req) {
        return buildSpec(req).call().content();
    }

    private ChatClient.ChatClientRequestSpec buildSpec(AiChatRequest req) {
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

        return spec;
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
