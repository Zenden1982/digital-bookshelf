package com.diplom.diplom.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.DTO.UserBookReadDTO;
import com.diplom.diplom.Service.TagService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<Tag>> getAllUserTags() {
        return ResponseEntity.ok(tagService.getAllUserTags());
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long tagId) {
        tagService.deleteTag(tagId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Добавить тег к книге на полке.
     * Тело запроса: {"tagName": "на-отпуск"}
     */
    @PostMapping("/userbook/{userBookId}")
    public ResponseEntity<UserBookReadDTO> addTagToUserBook(
            @PathVariable Long userBookId,
            @RequestBody Map<String, String> payload) {
        String tagName = payload.get("tagName");
        UserBookReadDTO updatedUserBook = tagService.addTagToUserBook(userBookId, tagName);
        return ResponseEntity.ok(updatedUserBook);
    }

    /**
     * Удалить тег с книги на полке.
     */
    @DeleteMapping("/userbook/{userBookId}/tag/{tagId}")
    public ResponseEntity<UserBookReadDTO> removeTagFromUserBook(
            @PathVariable Long userBookId,
            @PathVariable Long tagId) {
        UserBookReadDTO updatedUserBook = tagService.removeTagFromUserBook(userBookId, tagId);
        return ResponseEntity.ok(updatedUserBook);
    }
}
