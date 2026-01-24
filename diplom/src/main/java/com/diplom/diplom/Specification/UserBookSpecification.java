
package com.diplom.diplom.Specification;

import org.springframework.data.jpa.domain.Specification;

import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;

import jakarta.persistence.criteria.Join;

public class UserBookSpecification {

    public static Specification<UserBook> hasUser(User user) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("user"), user);
    }

    public static Specification<UserBook> hasStatus(Status status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null)
                return null;
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    public static Specification<UserBook> hasTag(String tagName) {
        return (root, query, criteriaBuilder) -> {
            if (tagName == null || tagName.trim().isEmpty())
                return null;
            Join<UserBook, Tag> tagsJoin = root.join("tags");
            return criteriaBuilder.equal(tagsJoin.get("name"), tagName);
        };
    }

    // --- ДОБАВЛЯЕМ ЭТОТ МЕТОД ---
    public static Specification<UserBook> hasIsFavorite(Boolean isFavorite) {
        return (root, query, criteriaBuilder) -> {
            // Если isFavorite == null или false, обычно мы НЕ фильтруем (показываем всё).
            // Если isFavorite == true, показываем только избранное.

            if (Boolean.TRUE.equals(isFavorite)) {
                return criteriaBuilder.isTrue(root.get("isFavorite")); // Или "favorite", проверь имя поля в Entity!
            }
            // Если пришел false или null, спецификация ничего не фильтрует (возвращает
            // null)
            return null;
        };
    }
}