package com.diplom.diplom.Entity.DTO;

import java.time.LocalDateTime;
import java.util.List;

import com.diplom.diplom.Entity.Role;

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
    private List<Role> roles;
    private LocalDateTime createdAt;
    private String avatarUrl;

    static public UserReadDTO toDTO(com.diplom.diplom.Entity.User user) {
        String avatarFileName = null;
        if (user.getImage() != null) {
            avatarFileName = user.getImage().getName();
        }

        return UserReadDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .avatarUrl(avatarFileName)
                .build();
    }
}
