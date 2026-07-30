package com.kidscolour.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadCoverImage(MultipartFile file);
    String uploadPreviewImage(MultipartFile file);
    void deleteImage(String publicId);
}
