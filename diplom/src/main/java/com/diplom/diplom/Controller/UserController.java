package com.diplom.diplom.Controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diplom.diplom.Entity.AuthRequest;
import com.diplom.diplom.Entity.DTO.UserCreateDTO;
import com.diplom.diplom.Entity.DTO.UserReadDTO;
import com.diplom.diplom.Service.ImageService;
import com.diplom.diplom.Service.UserService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/v1/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "BearerAuth")
public class UserController {

    private final UserService userService;

    private final ImageService imageService;

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

    @PutMapping("/{id}")
    public UserReadDTO updateUser(Long id, UserCreateDTO userCreateDTO) {
        return userService.updateUser(id, userCreateDTO);
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

    @PostMapping("/avatar")
    public ResponseEntity<String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String fileName = imageService.uploadUserAvatar(username, file);
        return ResponseEntity.ok("Аватарка обновлена: " + fileName);
    }

    @GetMapping("/avatar/{filename}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String filename) {
        byte[] image = imageService.getImageBytes(filename);
        MediaType mediaType = imageService.getMediaTypeForFileName(filename);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .body(image);
    }
}
