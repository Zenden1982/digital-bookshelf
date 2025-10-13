package com.diplom.diplom.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Shelf;

@Repository
public interface ShelfRepository extends JpaRepository<Shelf, Long> {

}
