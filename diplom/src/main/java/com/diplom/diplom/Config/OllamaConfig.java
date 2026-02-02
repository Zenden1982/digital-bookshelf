package com.diplom.diplom.Config;

import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.OllamaEmbeddingModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class OllamaConfig {

        // --- 1. API для ЧАТА (туннель) ---
        @Bean("chatOllamaApi")
        public OllamaApi chatOllamaApi(
                        @Value("${app.ollama.chat-url}") String chatBaseUrl,
                        RestClient.Builder restClientBuilder,
                        WebClient.Builder webClientBuilder) {

                return OllamaApi.builder()
                                .baseUrl(chatBaseUrl)
                                .restClientBuilder(restClientBuilder)
                                .webClientBuilder(webClientBuilder)
                                .build();
        }

        // --- 2. API для ЭМБЕДДИНГОВ (локальный контейнер) ---
        @Bean("embeddingOllamaApi")
        public OllamaApi embeddingOllamaApi(
                        @Value("${app.ollama.embedding-url}") String embeddingBaseUrl,
                        RestClient.Builder restClientBuilder,
                        WebClient.Builder webClientBuilder) {

                return OllamaApi.builder()
                                .baseUrl(embeddingBaseUrl)
                                .restClientBuilder(restClientBuilder)
                                .webClientBuilder(webClientBuilder)
                                .build();
        }

        // --- 3. Чат Модель (используем builder) ---
        @Bean
        @Primary
        public OllamaChatModel ollamaChatModel(
                        @Value("${spring.ai.ollama.chat.options.model:llama3.1}") String chatModel,
                        @Value("${app.ai.temperature:0.3}") Double temperature,
                        @Qualifier("chatOllamaApi") OllamaApi chatOllamaApi) {

                var options = OllamaOptions.builder()
                                .model(chatModel)
                                .temperature(temperature)
                                .build();

                // ВАЖНО: Используем .builder() вместо new OllamaChatModel(...)
                return OllamaChatModel.builder()
                                .ollamaApi(chatOllamaApi)
                                .defaultOptions(options)
                                .build();
        }

        // --- 4. Эмбеддинг Модель (используем builder) ---
        @Bean
        @Primary
        public OllamaEmbeddingModel ollamaEmbeddingModel(
                        @Value("${spring.ai.ollama.embedding.options.model:embeddinggemma}") String embeddingModel,
                        @Qualifier("embeddingOllamaApi") OllamaApi embeddingOllamaApi) {

                var options = OllamaOptions.builder()
                                .model(embeddingModel)
                                .build();

                // ВАЖНО: Используем .builder() вместо new OllamaEmbeddingModel(...)
                return OllamaEmbeddingModel.builder()
                                .ollamaApi(embeddingOllamaApi)
                                .defaultOptions(options)
                                .build();
        }
}
