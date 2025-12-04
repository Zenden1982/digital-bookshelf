package com.diplom.diplom.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException; // Добавлено
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.diplom.diplom.Config.JwtTokenUtils;
import com.diplom.diplom.Entity.AuthRequest;
import com.diplom.diplom.Entity.Role;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Entity.DTO.UserCreateDTO;
import com.diplom.diplom.Entity.DTO.UserReadDTO;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.RoleRepository;
import com.diplom.diplom.Repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Service
@Data
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final JwtTokenUtils jwtTokenUtils;

    @Transactional
    public UserReadDTO createUser(UserCreateDTO userCreateDTO) {
        Role roleUser = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_USER").build()));
        User user = User.builder()
                .username(userCreateDTO.getUsername())
                .password(passwordEncoder.encode(userCreateDTO.getPassword()))
                .roles(roleUser != null ? List.of(roleUser) : List.of())
                .email(userCreateDTO.getEmail())
                .build();
        User savedUser = userRepository.save(user);

        return UserReadDTO.toDTO(savedUser);
    }

    @Transactional
    public UserReadDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        String avatarUrl = null;
        if (user.getImage() != null) {
            avatarUrl = user.getImage().getName();
        }

        UserReadDTO userReadDTO = UserReadDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .roles(user.getRoles())
                .avatarUrl(avatarUrl)
                .build();
        return userReadDTO;
    }

    @Transactional
    public UserReadDTO getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null)
            return null;
        return UserReadDTO.toDTO(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public Map<String, Object> updateUser(Long id, UserCreateDTO updateDTO) {
        return userRepository.findById(id)
                .map(existingUser -> {
                    boolean usernameChanged = false;

                    if (updateDTO.getUsername() != null && !updateDTO.getUsername().isBlank()) {
                        if (!existingUser.getUsername().equals(updateDTO.getUsername())) {
                            if (userRepository.existsByUsername(updateDTO.getUsername())) {
                                throw new IllegalArgumentException("Имя пользователя уже занято");
                            }
                            existingUser.setUsername(updateDTO.getUsername());
                            usernameChanged = true;
                        }
                    }

                    if (updateDTO.getEmail() != null && !updateDTO.getEmail().isBlank()) {
                        existingUser.setEmail(updateDTO.getEmail());
                    }

                    if (updateDTO.getPassword() != null && !updateDTO.getPassword().isBlank()) {
                        existingUser.setPassword(passwordEncoder.encode(updateDTO.getPassword()));
                    }

                    User savedUser = userRepository.save(existingUser);
                    UserReadDTO userDTO = UserReadDTO.toDTO(savedUser);

                    Map<String, Object> response = new HashMap<>();
                    response.put("user", userDTO);

                    if (usernameChanged) {
                        String newToken = jwtTokenUtils.generateToken(savedUser);
                        response.put("token", newToken);
                        response.put("tokenUpdated", true);
                    } else {
                        response.put("tokenUpdated", false);
                    }

                    return response;
                })
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь с id: " + id + " не найден"));
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден"));
        return user;
    }

    public String generateToken(AuthRequest user, AuthenticationManager authenticationManager) {
        try {
            authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
        } catch (AuthenticationException e) {

            throw new BadCredentialsException("Неверный логин или пароль");
        }

        UserDetails userDetails = loadUserByUsername(user.getUsername());
        return jwtTokenUtils.generateToken(userDetails);
    }

    public UserReadDTO getMe(String username) {
        return getUserByUsername(username);
    }

    @Transactional
    public List<UserReadDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map(UserReadDTO::toDTO).toList();
    }
}
