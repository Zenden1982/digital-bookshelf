package com.diplom.diplom.Config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class OllamaConfig {

        // @Value("${REMOTE_OLLAMA_URL}")
        // private String remoteBaseUrl;

        // @Value("${REMOTE_MODEL_NAME}")
        // private String remoteModelName;

        // @Bean
        // public ChatModel chatModel(RestClient.Builder restClientBuilder,
        // WebClient.Builder webClientBuilder) {

        // // 1. Создаем API.
        // // В новых версиях конструктор требует 4 параметра, включая WebClient и
        // // ErrorHandler.
        // var remoteApi = new OllamaApi(
        // remoteBaseUrl,
        // restClientBuilder,
        // webClientBuilder,
        // new DefaultResponseErrorHandler() // Стандартный обработчик ошибок
        // );

        // // 2. Настраиваем опции.
        // // Префиксы "with" убрали. Теперь просто .model(), .temperature()
        // var options = OllamaOptions.builder()
        // .model(remoteModelName)
        // .temperature(0.3)
        // .build();

        // // 3. Создаем ChatModel.
        // // Билдер для модели часто меняется, надежнее использовать конструктор
        // напрямую.
        // return new OllamaChatModel(remoteApi, options);
        // }
}
