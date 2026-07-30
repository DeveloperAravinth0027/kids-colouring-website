package com.kidscolour.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.kidscolour.exception.FileUploadException;
import com.kidscolour.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${app.cloudinary.folder.book-covers}")
    private String bookCoversFolder;

    @Value("${app.cloudinary.folder.preview-images}")
    private String previewImagesFolder;

    @Override
    public String uploadCoverImage(MultipartFile file) {
        return uploadImage(file, bookCoversFolder);
    }

    @Override
    public String uploadPreviewImage(MultipartFile file) {
        return uploadImage(file, previewImagesFolder);
    }

    @Override
    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted image from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary", e);
        }
    }

    private String uploadImage(MultipartFile file, String folder) {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "use_filename", true,
                    "unique_filename", true
            ));
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            log.error("Error uploading image to Cloudinary", e);
            throw new FileUploadException("Error uploading image", e);
        }
    }
}
