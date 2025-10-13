package com.diplom.diplom.Entity.DTO;

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
public class UserCreateDTO {

    private String username;

    private String password;

    private String email;

    public User toUser() {
        User user = new User();
        user.setUsername(this.username);
        user.setPassword(this.password);
        user.setEmail(this.email);
        user.setRole(Role.USER);
        return user;
    }
}
