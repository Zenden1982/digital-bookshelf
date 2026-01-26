package com.diplom.diplom.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.GraphDTO;
import com.diplom.diplom.Service.ReadingMapService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/map")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
public class ReadingMapController {
    private final ReadingMapService readingMapService;

    @GetMapping
    public ResponseEntity<GraphDTO> getMyMap() {
        return ResponseEntity.ok(readingMapService.getUserLibraryGraph());
    }
}
