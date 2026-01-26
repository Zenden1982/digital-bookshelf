package com.diplom.diplom.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class GraphRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Извлекает векторы для списка ID книг.
     * 
     * @param bookIds список ID книг (Long)
     * @return Map, где ключ - ID книги, значение - список Double (вектор)
     */
    public Map<Long, List<Double>> findVectorsForBooks(List<Long> bookIds) {
        if (bookIds == null || bookIds.isEmpty()) {
            return Collections.emptyMap();
        }

        // 1. Формируем строку плейсхолдеров для SQL IN (?,?,?)
        String placeholders = String.join(",", Collections.nCopies(bookIds.size(), "?"));

        // 2. SQL запрос.
        // ВАЖНО: Мы предполагаем, что таблица называется 'vector_store' (стандарт
        // Spring AI),
        // а ID книги лежит в JSONB поле 'metadata' под ключом 'book_id'.
        String sql = String.format(
                "SELECT metadata->>'book_id' as bid, embedding " +
                        "FROM vector_store " +
                        "WHERE CAST(metadata->>'book_id' AS BIGINT) IN (%s)",
                placeholders);

        Map<Long, List<Double>> result = new HashMap<>();

        // 3. Выполняем запрос
        jdbcTemplate.query(sql, bookIds.toArray(), (rs) -> {
            String bidStr = rs.getString("bid");
            String vectorStr = rs.getString("embedding"); // pgvector отдает строку вида "[0.1, 0.5, ...]"

            if (bidStr != null && vectorStr != null) {
                try {
                    Long bookId = Long.parseLong(bidStr);
                    List<Double> vector = parseVectorString(vectorStr);
                    result.put(bookId, vector);
                } catch (NumberFormatException e) {
                    // Игнорируем битые данные
                }
            }
        });

        return result;
    }

    // Парсит строку "[0.012, -0.234, ...]" в List<Double>
    private List<Double> parseVectorString(String vectorStr) {
        // Удаляем квадратные скобки
        String clean = vectorStr.replace("[", "").replace("]", "");
        if (clean.isBlank())
            return Collections.emptyList();

        String[] parts = clean.split(",");
        List<Double> vec = new ArrayList<>(parts.length);

        for (String part : parts) {
            try {
                vec.add(Double.parseDouble(part.trim()));
            } catch (NumberFormatException e) {
                vec.add(0.0); // Fallback
            }
        }
        return vec;
    }
}
