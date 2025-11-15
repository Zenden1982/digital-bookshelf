package com.diplom.diplom.Entity.DTO;

import com.diplom.diplom.Entity.Status;

import lombok.Data;

@Data
public class UserBookUpdateDTO {

    private Long userBookId;

    private Integer progress;

    private Status status;
    private Integer rating;

    private Integer currentPage;
}
