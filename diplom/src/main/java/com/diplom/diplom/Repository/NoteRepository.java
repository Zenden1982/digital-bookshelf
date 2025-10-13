package com.diplom.diplom.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.diplom.diplom.Entity.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

}
