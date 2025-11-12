package com.diplom.diplom.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diplom.diplom.Entity.AuthRequest;
import com.diplom.diplom.Entity.DTO.UserCreateDTO;
import com.diplom.diplom.Entity.DTO.UserReadDTO;
import com.diplom.diplom.Service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public UserReadDTO registerUser(@RequestBody UserCreateDTO userCreateDTO) {
        return userService.createUser(userCreateDTO);
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public UserReadDTO getUserById(Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/{username}")
    public UserReadDTO getUserByUsername(String username) {
        return userService.getUserByUsername(username);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(Long id) {
        userService.deleteUser(id);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody @jakarta.validation.Valid AuthRequest user) {
        return ResponseEntity.ok(userService.generateToken(user, authenticationManager));
    }

    @GetMapping("/me")
    public ResponseEntity<UserReadDTO> getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return ResponseEntity.ok(userService.getMe(username));
    }
}
