package com.diplom.diplom.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Image;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

}
