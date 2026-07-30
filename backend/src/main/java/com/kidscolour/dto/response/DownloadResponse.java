package com.kidscolour.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DownloadResponse {
    private String token;
    private Long bookId;
    private String bookName;
    private Integer downloadCount;
    private Integer maxDownloads;
    private LocalDateTime expiresAt;
    private String downloadUrl; // Transient field for returning signed URL
}
