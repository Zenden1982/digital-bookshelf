package com.diplom.diplom.Service;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.DTO.AnalyticsDTO;
import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserBookRepository userBookRepository;
    private final UserRepository userRepository;

    public AnalyticsDTO getUserAnalytics(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserBook> userBooks = userBookRepository.findByUser(user);

        // 1. Базовая статистика
        long total = userBooks.size();
        long read = userBooks.stream().filter(ub -> ub.getStatus() == Status.FINISHED).count();
        long reading = userBooks.stream().filter(ub -> ub.getStatus() == Status.READING).count();
        long planned = userBooks.stream().filter(ub -> ub.getStatus() == Status.PLAN_TO_READ).count();

        // 2. Средний рейтинг (считаем только там, где он проставлен > 0)
        double avgRating = userBooks.stream()
                .filter(ub -> ub.getRating() != null && ub.getRating() > 0)
                .mapToInt(UserBook::getRating)
                .average()
                .orElse(0.0);

        // 3. Распределение по жанрам
        Map<String, Long> genres = userBooks.stream()
                .flatMap(ub -> ub.getBook().getGenres().stream())
                .collect(Collectors.groupingBy(g -> g, Collectors.counting()));

        // 4. Активность за последние 6 месяцев
        Map<String, Long> activity = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            String monthName = now.minusMonths(i).getMonth()
                    .getDisplayName(TextStyle.SHORT_STANDALONE, new Locale("ru"));
            activity.put(monthName, 0L);
        }

        userBooks.stream()
                .filter(ub -> ub.getStatus() == Status.FINISHED && ub.getUpdatedAt() != null)
                .filter(ub -> ub.getUpdatedAt().isAfter(now.minusMonths(6)))
                .forEach(ub -> {
                    String month = ub.getUpdatedAt().getMonth()
                            .getDisplayName(TextStyle.SHORT_STANDALONE, new Locale("ru"));
                    if (activity.containsKey(month)) {
                        activity.put(month, activity.get(month) + 1);
                    }
                });

        // --- ВОТ ЭТО БЫЛО ПРОПУЩЕНО ---
        // 5. Расчет эквивалента (сумма прогресса / 100)
        double totalProgressSum = userBooks.stream()
                .mapToInt(ub -> ub.getProgress() != null ? ub.getProgress() : 0)
                .sum();
        double equivalent = totalProgressSum / 100.0;
        // -----------------------------

        // 6. Общий объем (Стандартные страницы)
        long totalPages = userBooks.stream()
                .mapToLong(ub -> {
                    int standardPages = ub.getBook().getPageCount() != null ? ub.getBook().getPageCount() : 0;
                    if (ub.getStatus() == Status.FINISHED)
                        return standardPages;
                    return (long) (standardPages * (ub.getProgress() != null ? ub.getProgress() / 100.0 : 0));
                })
                .sum();

        return AnalyticsDTO.builder()
                .totalBooks(total)
                .booksRead(read)
                .booksReading(reading)
                .booksPlanned(planned)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .genreDistribution(genres)
                .totalReadingEquivalent(Math.round(equivalent * 10.0) / 10.0) // Теперь переменная существует
                .monthlyActivity(activity)
                .totalStandardPages(totalPages)
                .build();
    }
}
