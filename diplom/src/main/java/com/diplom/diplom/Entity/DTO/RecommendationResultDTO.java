package com.diplom.diplom.Entity.DTO;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecommendationResultDTO {
    private BookReadDTO book;
    private double similarity; // similarity от vector search
    private double score; // итоговый score (пока = similarity, можно расширять)
    private String explanation; // человеческий текст
}
