package com.diplom.diplom.Config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.diplom.diplom.Entity.Role;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.RoleRepository;
import com.diplom.diplom.Repository.UserRepository;

@Configuration
public class Initialization {

    @Bean
    public CommandLineRunner initRoles(RoleRepository roleRepository, UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (roleRepository.findByName("ROLE_USER") == null) {
                Role userRole = new Role();
                userRole.setName("USER");
                roleRepository.save(userRole);
            }
            if (roleRepository.findByName("ROLE_ADMIN") == null) {
                Role adminRole = new Role();
                adminRole.setName("ADMIN");
                roleRepository.save(adminRole);
            }

            if (userRepository.findByUsername("admin").isPresent()) {
                return;
            }

            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new ResourceNotFoundException("Роль ADMIN не найдена"));
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Роль USER не найдена"));

            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@example.com"); // если есть поле
            admin.setPassword(passwordEncoder.encode("admin123")); // задай свой пароль
            admin.setRoles(List.of(adminRole, userRole)); // или Collections.singleton(adminRole)

            userRepository.save(admin);
        };
    }

}
