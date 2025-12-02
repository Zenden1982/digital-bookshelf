package com.diplom.diplom.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.diplom.diplom.Entity.Image;
import com.diplom.diplom.Entity.User;
import com.diplom.diplom.Exception.ResourceNotFoundException;
import com.diplom.diplom.Repository.ImageRepository;
import com.diplom.diplom.Repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    @Value("${app.images.path:src/main/resources/static/images}")
    private String bucketPath;

    /**
     * Загрузка аватарки для пользователя
     */
    public String uploadUserAvatar(String username, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Файл не может быть пустым");
        }

        try {
            // 1. Получаем пользователя
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + username));

            // 2. Генерируем уникальное имя файла, чтобы не было конфликтов
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String uniqueFileName = UUID.randomUUID().toString() + extension;

            // 3. Сохраняем файл на диск
            Path destinationPath = Path.of(bucketPath).resolve(uniqueFileName);
            Files.createDirectories(destinationPath.getParent());
            Files.copy(file.getInputStream(), destinationPath, StandardCopyOption.REPLACE_EXISTING);

            // 4. Сохраняем информацию в БД
            if (user.getImage() != null) {
                deleteImageFile(user.getImage().getName());
                imageRepository.delete(user.getImage());
            }

            Image imageEntity = new Image();
            imageEntity.setName(uniqueFileName);
            imageEntity.setPath(destinationPath.toString());
            imageEntity.setUser(user);

            imageRepository.save(imageEntity);

            user.setImage(imageEntity);
            userRepository.save(user);

            log.info("Аватарка загружена для пользователя {}: {}", username, uniqueFileName);
            return uniqueFileName;

        } catch (IOException e) {
            log.error("Ошибка сохранения файла", e);
            throw new RuntimeException("Не удалось сохранить файл", e);
        }
    }

    /**
     * Получение байтов картинки по имени файла
     */
    public byte[] getImageBytes(String imageName) {
        try {
            Path fullPath = Path.of(bucketPath).resolve(imageName);
            if (Files.exists(fullPath)) {
                return Files.readAllBytes(fullPath);
            } else {
                throw new ResourceNotFoundException("Файл не найден: " + imageName);
            }
        } catch (IOException e) {
            throw new RuntimeException("Ошибка чтения файла", e);
        }
    }

    /**
     * Динамически определяет MediaType для файла
     */
    public MediaType getMediaTypeForFileName(String fileName) {
        Path path = Path.of(bucketPath).resolve(fileName);
        try {
            String mimeType = Files.probeContentType(path);
            if (mimeType != null) {
                return MediaType.parseMediaType(mimeType);
            }
        } catch (IOException e) {
            log.warn("Не удалось определить MIME-тип для файла: {}", fileName, e);
        }
        // Запасной вариант
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    /**
     * Удаление файла с диска
     */
    private void deleteImageFile(String imageName) {
        try {
            Path fullPath = Path.of(bucketPath).resolve(imageName);
            Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            log.warn("Не удалось удалить старый файл: {}", imageName);
        }
    }
}
