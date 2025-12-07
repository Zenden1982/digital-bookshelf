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
    public CommandLineRunner initRoles(RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (roleRepository.findByName("ROLE_USER").isEmpty()) {
                Role userRole = new Role();
                userRole.setName("ROLE_USER");
                roleRepository.save(userRole);
            }
            if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
                Role adminRole = new Role();
                adminRole.setName("ROLE_ADMIN");
                roleRepository.save(adminRole);
            }

            if (userRepository.findByUsername("admin2").isPresent()) {
                return;
            }

            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new ResourceNotFoundException("Роль ROLE_ADMIN не найдена"));
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new ResourceNotFoundException("Роль ROLE_USER не найдена"));

            User admin = new User();
            admin.setUsername("admin2");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRoles(List.of(adminRole, userRole));

            userRepository.save(admin);
        };
    }
}
