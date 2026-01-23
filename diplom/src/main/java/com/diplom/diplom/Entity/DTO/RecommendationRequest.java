package com.diplom.diplom.Entity.DTO;

import java.util.List;

import lombok.Data;

@Data
public class RecommendationRequest {
    private List<Long> bookIds; // ID книг-ориентиров
    private List<String> tags; // Выбранные теги
    private String additionalText; // Свободный текст
    private Double threshold; // Порог похожести (0.0 - 1.0), по дефолту можно 0.4
    private Integer limit; // Сколько искать в векторе (до фильтрации)
}