package com.diplom.diplom.Entity.DTO;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class RecommendationMixRequestDTO {
    private List<Long> anchorBookIds = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private String additionalText;

    // Настройки поиска
    private Integer topK = 80; // сколько кандидатов попросить у vector store
    private Double threshold = 0.35; // минимальная похожесть
}
