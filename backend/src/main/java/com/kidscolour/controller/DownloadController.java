package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.DownloadResponse;
import com.kidscolour.service.DownloadService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/downloads")
@RequiredArgsConstructor
public class DownloadController {

    private final DownloadService downloadService;

    @GetMapping("/{token}")
    public ResponseEntity<Void> downloadFile(
            @PathVariable String token,
            Authentication authentication,
            HttpServletRequest request) {
            
        String ipAddress = request.getRemoteAddr();
        String secureUrl = downloadService.getSecureDownloadUrl(token, authentication.getName(), ipAddress);
        
        // Redirect the user to the temporary S3 presigned URL
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(secureUrl))
                .build();
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DownloadResponse>>> getMyDownloads(Authentication authentication) {
        List<DownloadResponse> response = downloadService.getUserDownloads(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Downloads fetched successfully", response));
    }
}
