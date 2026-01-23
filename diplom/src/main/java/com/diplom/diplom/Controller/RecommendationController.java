package com.diplom.diplom.Controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.RecommendationMixRequestDTO;
import com.diplom.diplom.Entity.DTO.RecommendationResultDTO;
import com.diplom.diplom.Service.RecommendationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Recommendations", description = "AI Recommendation Endpoints")
public class RecommendationController {

    private final RecommendationService recommendationService;

    // --- БЛОК 1: Контекстные ("Потому что вам понравился...") ---
    @GetMapping("/history")
    @Operation(summary = "Based on last active book")
    public ResponseEntity<Page<RecommendationResultDTO>> getBasedOnHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(recommendationService.getRecommendationsBasedOnHistory(page, size));
    }

    // --- БЛОК 2: Неожиданные находки (Serendipity) ---
    @GetMapping("/serendipity")
    @Operation(summary = "Unexpected findings (high distance)")
    public ResponseEntity<Page<RecommendationResultDTO>> getSerendipity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(recommendationService.getSerendipityRecommendations(page, size));
    }

    // --- БЛОК 4: Микс по настроению (Interactive) ---
    @GetMapping("/mood")
    @Operation(summary = "Mood + Length + Age filters")
    public ResponseEntity<Page<RecommendationResultDTO>> getByMood(
            @RequestParam String text, // "Мрачное", "Веселое"
            @RequestParam(defaultValue = "ANY") String length, // SHORT, LONG, ANY
            @RequestParam(defaultValue = "ANY") String age, // NEW, CLASSIC, ANY
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(recommendationService.getMoodRecommendations(text, length, age, page, size));
    }

    // --- СЦЕНАРИЙ А: Похожие на книгу (Item-to-Item) ---
    @GetMapping("/similar-to/{bookId}")
    public ResponseEntity<Page<RecommendationResultDTO>> similarTo(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // Вызываем метод сервиса (код для вставки ниже, если его нет)
        return ResponseEntity.ok(recommendationService.similarTo(bookId, page, size));
    }

    // --- LEGACY / CONSTRUCTOR ---
    @PostMapping("/mix")
    public ResponseEntity<Page<RecommendationResultDTO>> mix(
            @RequestBody RecommendationMixRequestDTO request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(recommendationService.mix(request, page, size));
    }

    // --- UI HELPERS ---
    @GetMapping("/tags")
    public ResponseEntity<List<String>> tags() {
        return ResponseEntity.ok(recommendationService.getUserTags());
    }
}
