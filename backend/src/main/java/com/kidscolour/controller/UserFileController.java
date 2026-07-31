package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.UserResponse;
import com.kidscolour.service.AuthService;
import com.kidscolour.service.UserAvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;

/**
 * Customer profile photos: upload your own picture, and serve it publicly.
 */
@RestController
@RequiredArgsConstructor
public class UserFileController {

    private final UserAvatarService userAvatarService;
    private final AuthService authService;

    /** The logged-in customer uploads/replaces their profile photo. */
    @PostMapping(value = "/api/users/me/avatar", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) throws IOException {
        userAvatarService.uploadAvatar(authentication.getName(), file);
        UserResponse user = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Profile photo updated", user));
    }

    /** Public: stream a user's avatar image. */
    @GetMapping("/api/files/users/{userId}/avatar")
    public ResponseEntity<byte[]> avatar(@PathVariable Long userId) throws IOException {
        UserAvatarService.AvatarImage img = userAvatarService.readAvatar(userId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, img.contentType())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(img.bytes());
    }
}
