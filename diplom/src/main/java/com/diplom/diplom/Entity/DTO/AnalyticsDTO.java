package com.diplom.diplom.Entity.DTO;

import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalyticsDTO {
    private long totalBooks;
    private long booksRead;
    private long booksReading;
    private long booksPlanned;

    // Средняя оценка пользователя
    private double averageRating;

    // Распределение по жанрам (Жанр -> кол-во книг)
    private Map<String, Long> genreDistribution;

    // Активность за последние 6 месяцев (Месяц -> кол-во прочитанных)
    private Map<String, Long> readingActivity;

    // Общий прогресс (сумма процентов всех книг / 100 -> эквивалент полных книг)
    private double totalReadingEquivalent;

    private Map<String, Long> monthlyActivity; // Месяц -> Кол-во прочитанных
    private long totalStandardPages; // Сумма страниц по метаданным (объем чтения)
}
