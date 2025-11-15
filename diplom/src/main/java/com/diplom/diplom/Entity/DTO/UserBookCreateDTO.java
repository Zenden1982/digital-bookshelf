package com.diplom.diplom.Entity.DTO;

import com.diplom.diplom.Entity.Status;

import lombok.Data;

@Data
public class UserBookCreateDTO {

    private Long bookId;
    private Status status;
}
