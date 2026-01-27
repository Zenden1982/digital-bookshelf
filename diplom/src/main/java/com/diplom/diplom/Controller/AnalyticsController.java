package com.diplom.diplom.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.AnalyticsDTO;
import com.diplom.diplom.Service.AnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<AnalyticsDTO> getMyAnalytics(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getUserAnalytics(authentication.getName()));
    }
}
