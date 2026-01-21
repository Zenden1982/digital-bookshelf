package com.diplom.diplom.Controller;

import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendation Controller", description = "API for book recommendations")
@SecurityRequirement(name = "BearerAuth")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @Operation(summary = "Get recommendations based on a user tag")
    @GetMapping("/by-tag")
    public ResponseEntity<Page<BookReadDTO>> getRecommendationsByTag(
            @RequestParam String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(recommendationService.getRecommendationsByTag(tag, page, size));
    }

    @Operation(summary = "Get list of user's tags")
    @GetMapping("/tags")
    public ResponseEntity<List<String>> getUserTags() {
        return ResponseEntity.ok(recommendationService.getUserTags());
    }
}
