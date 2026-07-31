package com.kidscolour.service;

import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.User;
import com.kidscolour.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Profile photos. A customer uploads their own picture; it's stored on disk
 * (like book covers) under uploads/users/{id}/avatar.img and served back via a
 * short public URL kept on the user row.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserAvatarService {

    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public record AvatarImage(byte[] bytes, String contentType) {}

    @Transactional
    public String uploadAvatar(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String type = file.getContentType();
        if (type == null || !type.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        Path target = Paths.get(uploadDir).resolve("users/" + user.getId() + "/avatar.img");
        Files.createDirectories(target.getParent());
        Files.write(target, file.getBytes());

        // Cache-busting version so the browser drops the old photo after a change.
        String url = "/api/files/users/" + user.getId() + "/avatar?v=" + System.currentTimeMillis();
        user.setAvatarUrl(url);
        userRepository.save(user);
        log.info("User {} — avatar stored ({} bytes)", user.getId(), file.getSize());
        return url;
    }

    @Transactional(readOnly = true)
    public AvatarImage readAvatar(Long userId) throws IOException {
        Path file = Paths.get(uploadDir).resolve("users/" + userId + "/avatar.img");
        if (!Files.exists(file)) throw new ResourceNotFoundException("No avatar for this user");
        byte[] bytes = Files.readAllBytes(file);
        return new AvatarImage(bytes, sniffImageType(bytes));
    }

    /** Detect image type from magic bytes so PNG/JPEG/WebP all serve correctly. */
    private static String sniffImageType(byte[] b) {
        if (b != null && b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        if (b != null && b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) {
            return "image/jpeg";
        }
        return "image/png";
    }
}
