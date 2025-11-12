package com.diplom.diplom.Config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.diplom.diplom.Entity.Role;
import com.diplom.diplom.Repository.RoleRepository;

@Configuration
public class Initialization {

    @Bean
    public CommandLineRunner initRoles(RoleRepository roleRepository) {
        return args -> {
            if (roleRepository.findByName("ROLE_USER") == null) {
                Role userRole = new Role();
                userRole.setName("ROLE_USER");
                roleRepository.save(userRole);
            }
            if (roleRepository.findByName("ROLE_ADMIN") == null) {
                Role adminRole = new Role();
                adminRole.setName("ROLE_ADMIN");
                roleRepository.save(adminRole);
            }
        };
    }
}
