package com.diplom.diplom.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.DTO.AiChatRequest;
import com.diplom.diplom.Entity.DTO.AiChatResponse;
import com.diplom.diplom.Service.AiChatService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest req) {
        return ResponseEntity.ok(new AiChatResponse(aiChatService.chat(req)));
    }
}
