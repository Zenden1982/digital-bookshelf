package com.diplom.diplom.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.diplom.diplom.Entity.Book;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.GraphDTO;
import com.diplom.diplom.Repository.GraphRepository;
import com.diplom.diplom.Repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingMapService {

    private final UserRepository userRepository;
    private final GraphRepository graphRepository;

    // Порог похожести (0.0 - 1.0).
    // Если косинусное сходство меньше 0.70, мы считаем книги слишком разными и не
    // рисуем линию.
    private static final double SIMILARITY_THRESHOLD = 0.4;

    @Transactional(readOnly = true)
    public GraphDTO getUserLibraryGraph() {
        // 1. Получаем текущего юзера
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserBook> userBooks = user.getUserBooks();
        if (userBooks == null || userBooks.isEmpty()) {
            return new GraphDTO(List.of(), List.of());
        }

        // 2. Формируем Узлы (Nodes) и собираем ID книг
        List<GraphDTO.Node> nodes = new ArrayList<>();
        List<Long> bookIds = new ArrayList<>();

        for (UserBook ub : userBooks) {
            Book b = ub.getBook();
            if (b == null)
                continue;

            bookIds.add(b.getId());

            // Размер узла зависит от оценки (1..5), если нет оценки - то средний размер (3)
            int nodeSize = (ub.getRating() != null) ? ub.getRating() : 3;
            // Группа для цвета (FINISHED, READING, etc.)
            String group = (ub.getStatus() != null) ? ub.getStatus().name() : "UNKNOWN";

            nodes.add(new GraphDTO.Node(
                    b.getId(),
                    b.getTitle(),
                    b.getCoverUrl(), // Убедитесь, что в Book есть это поле
                    group,
                    nodeSize));
        }

        // 3. Достаем векторы из базы (одним запросом)
        Map<Long, List<Double>> vectorsMap = graphRepository.findVectorsForBooks(bookIds);

        List<GraphDTO.Link> links = new ArrayList<>();

        // 4. Сравниваем "Каждый с Каждым" (O(N^2))
        // Для библиотеки до 500-1000 книг это очень быстро (миллисекунды)
        for (int i = 0; i < bookIds.size(); i++) {
            for (int j = i + 1; j < bookIds.size(); j++) {
                Long id1 = bookIds.get(i);
                Long id2 = bookIds.get(j);

                List<Double> v1 = vectorsMap.get(id1);
                List<Double> v2 = vectorsMap.get(id2);

                // Если у обеих книг есть векторы - считаем сходство
                if (v1 != null && v2 != null) {
                    double similarity = cosineSimilarity(v1, v2);

                    // Если сходство выше порога - создаем связь
                    if (similarity > SIMILARITY_THRESHOLD) {
                        // Вычисляем "силу" связи (для толщины линии на фронте)
                        // Нормализуем: (0.70 .. 1.00) -> (1 .. 10)
                        int strength = (int) ((similarity - SIMILARITY_THRESHOLD) * 33);
                        strength = Math.max(1, strength); // Минимум 1

                        links.add(new GraphDTO.Link(id1, id2, strength));
                    }
                }
            }
        }

        log.info("Graph built for user {}: {} nodes, {} links", username, nodes.size(), links.size());
        return new GraphDTO(nodes, links);
    }

    /**
     * Вычисляет косинусное сходство (Cosine Similarity) между двумя векторами.
     * Результат от -1.0 до 1.0 (нас интересует 0..1).
     */
    private double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1.size() != v2.size())
            return 0.0;

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            normA += Math.pow(v1.get(i), 2);
            normB += Math.pow(v2.get(i), 2);
        }

        if (normA == 0 || normB == 0)
            return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
