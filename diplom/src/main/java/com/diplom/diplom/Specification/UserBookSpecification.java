package com.diplom.diplom.Specification;

import org.springframework.data.jpa.domain.Specification;

import com.diplom.diplom.Entity.Status;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.UserBook;

public class UserBookSpecification {

    public static Specification<UserBook> hasUser(User user) {
        return (root, query, cb) -> cb.equal(root.get("user"), user);
    }

    public static Specification<UserBook> hasStatus(Status status) {
        if (status == null) {
            return null; // не добавлять фильтр, если статус не указан
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
