package com.kidscolour.service;

import org.springframework.web.multipart.MultipartFile;

public interface S3Service {
    String uploadFile(MultipartFile file);
    String generatePresignedUrl(String objectKey);
    void deleteFile(String objectKey);
}
