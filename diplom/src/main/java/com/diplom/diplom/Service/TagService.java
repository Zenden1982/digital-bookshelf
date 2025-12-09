package com.diplom.diplom.Service;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import com.diplom.diplom.Entity.DTO.UserBookReadDTO;
import com.diplom.diplom.Exception.AccessDeniedException;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.TagRepository;
import com.diplom.diplom.Repository.UserBookRepository;
import com.diplom.diplom.Repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final UserBookRepository userBookRepository;
    private final UserRepository userRepository;
    private final UserBookService userBookService;

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + username));
    }

    @Transactional
    public UserBookReadDTO addTagToUserBook(Long userBookId, String tagName) {
        User currentUser = getCurrentUser();
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("Запись на полке не найдена"));

        if (!userBook.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Нет доступа к этой записи на полке");
        }

        Tag tag = tagRepository.findByNameAndUser(tagName, currentUser)
                .orElseGet(() -> {
                    Tag newTag = new Tag();
                    newTag.setName(tagName);
                    newTag.setUser(currentUser);
                    return tagRepository.save(newTag);
                });

        if (!userBook.getTags().contains(tag)) {
            userBook.getTags().add(tag);
        }

        UserBook updatedUserBook = userBookRepository.save(userBook);

        return userBookService.map(updatedUserBook);
    }

    @Transactional
    public UserBookReadDTO removeTagFromUserBook(Long userBookId, Long tagId) {
        User currentUser = getCurrentUser();
        UserBook userBook = userBookRepository.findById(userBookId)
                .orElseThrow(() -> new ResourceNotFoundException("Запись на полке не найдена"));

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Тег не найден"));

        if (!userBook.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Нет доступа к этой книге");
        }

        userBook.getTags().remove(tag);
        UserBook updatedUserBook = userBookRepository.save(userBook);

        return userBookService.map(updatedUserBook);
    }

    public List<Tag> getAllUserTags() {
        User currentUser = getCurrentUser();
        return tagRepository.findByUser(currentUser);
    }

    @Transactional
    public void deleteTag(Long tagId) {
        User currentUser = getCurrentUser();
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Тег не найден"));

        if (!tag.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Вы не можете удалить чужой тег");
        }

        tag.getUserBooks().forEach(userBook -> userBook.getTags().remove(tag));
        tagRepository.delete(tag);
    }
}
