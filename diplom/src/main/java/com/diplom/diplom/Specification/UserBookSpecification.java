
package com.diplom.diplom.Specification;

import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.Tag;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

public class UserBookSpecification {

    public static Specification<UserBook> hasUser(User user) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("user"), user);
    }

    public static Specification<UserBook> hasStatus(Status status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) return null;
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    public static Specification<UserBook> hasTag(String tagName) {
        return (root, query, criteriaBuilder) -> {
            if (tagName == null || tagName.trim().isEmpty()) return null;

            Join<UserBook, Tag> tagsJoin = root.join("tags");

            return criteriaBuilder.equal(tagsJoin.get("name"), tagName);
        };
    }
}
