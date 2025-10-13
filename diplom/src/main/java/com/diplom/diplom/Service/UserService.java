package com.diplom.diplom.Service;

import org.springframework.stereotype.Service;

import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.DTO.UserCreateDTO;
import com.diplom.diplom.Entity.DTO.UserReadDTO;
import com.diplom.diplom.Repository.UserRepository;

import lombok.Data;

@Service
@Data
public class UserService {

    private final UserRepository userRepository;

    public UserReadDTO createUser(UserCreateDTO userCreateDTO) {
        User user = new User();
        user.setUsername(userCreateDTO.getUsername());
        user.setEmail(userCreateDTO.getEmail());
        user.setPassword(userCreateDTO.getPassword());
        userRepository.save(user);
        return UserReadDTO.fromUser(user);
    }

    public UserReadDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return UserReadDTO.fromUser(user);
    }

    public UserReadDTO getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        return UserReadDTO.fromUser(user);
    }
}
