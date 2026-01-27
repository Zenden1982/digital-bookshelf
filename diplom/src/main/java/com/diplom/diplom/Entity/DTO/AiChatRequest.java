package com.diplom.diplom.Entity.DTO;

import java.util.List;

public record AiChatRequest(
        String action, // translate | explain | summarize | qa
        String language, // ru | en | ...
        String selectedText, // выделенный фрагмент
        String userMessage, // вопрос
        List<Message> history // история сообщений (последние N)
) {
    public record Message(String role, String content) {
    }
}
