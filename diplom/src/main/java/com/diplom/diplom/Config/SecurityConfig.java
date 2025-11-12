package com.diplom.diplom.Config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.diplom.diplom.Service.UserService;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final UserService userService;

        private final JwtRequestFilter jwtRequestFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .headers(headers -> headers.frameOptions(
                                                frameOptionsCustomizer -> frameOptionsCustomizer.disable()))
                                .authorizeHttpRequests(requests -> requests.requestMatchers("/**").permitAll())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(
                                                                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(
                                                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                // Указываем домены, с которых разрешены запросы
                configuration.setAllowedOrigins(Arrays.asList(
                                "http://localhost:5173",
                                "http://localhost:8080",
                                "https://окно-в.рф",
                                "https://xn----dtbwmdc.xn--p1ai"));

                // Разрешаем все стандартные методы, включая OPTIONS
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                // Разрешаем отправку кук и заголовков авторизации
                configuration.setAllowCredentials(true);
                // Разрешаем все заголовки, включая 'Content-Type' и 'Authorization'
                configuration.setAllowedHeaders(Arrays.asList("*"));

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                // Применяем эту конфигурацию ко всем путям в вашем API
                source.registerCorsConfiguration("/**", configuration); // Применяем ко всем путям
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
                        throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
                DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
                authProvider.setUserDetailsService(userService);
                authProvider.setPasswordEncoder(passwordEncoder);
                return authProvider;
        }

}