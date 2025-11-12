package com.diplom.diplom.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.UserBook;

@Repository
public interface UserBookRepository extends JpaRepository<UserBook, Long> {

}
