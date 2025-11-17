package com.diplom.diplom.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.User;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    // Найти тег по имени и пользователю (чтобы избежать дубликатов тегов у одного
    // юзера)
    Optional<Tag> findByNameAndUser(String name, User user);

    // Получить все теги конкретного пользователя
    List<Tag> findByUser(User user);
}
