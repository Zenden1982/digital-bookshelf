package com.diplom.diplom.Controller;

import com.diplom.diplom.Entity.DTO.BookReadDTO;
import com.diplom.diplom.Service.ReadingMapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reading-maps")
@RequiredArgsConstructor
@Tag(name = "Reading Map Controller", description = "API for generating and managing reading paths")
@SecurityRequirement(name = "BearerAuth")
public class ReadingMapController {

    private final ReadingMapService readingMapService;

    @Operation(summary = "Generate a semantic reading path")
    @GetMapping("/generate")
    public ResponseEntity<List<BookReadDTO>> generatePath(
            @RequestParam Long seedBookId,
            @RequestParam(defaultValue = "5") int length) {
        
        List<BookReadDTO> path = readingMapService.generateReadingPath(seedBookId, length);
        return ResponseEntity.ok(path);
    }
}
