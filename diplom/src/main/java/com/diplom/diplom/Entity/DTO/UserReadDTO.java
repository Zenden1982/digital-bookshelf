package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;

import com.diplom.diplom.Entity.Role;
import com.diplom.diplom.Entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReadDTO {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private LocalDateTime createdAt;

    public static UserReadDTO fromUser(User user) {
        return UserReadDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreated_at())
                .build();
    }
}
