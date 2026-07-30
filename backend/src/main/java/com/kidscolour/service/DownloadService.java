package com.kidscolour.service;

import com.kidscolour.dto.response.DownloadResponse;

import java.util.List;

public interface DownloadService {
    String getSecureDownloadUrl(String token, String userEmail, String ipAddress);
    List<DownloadResponse> getUserDownloads(String userEmail);
    void generateDownloadLinksForOrderItems(Long orderId);
}
