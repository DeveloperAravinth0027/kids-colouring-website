package com.kidscolour.service.impl;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.kidscolour.exception.FileUploadException;
import com.kidscolour.service.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URL;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3ServiceImpl implements S3Service {

    private final AmazonS3 amazonS3;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.aws.s3.presigned-url-expiration-hours}")
    private int presignedUrlExpirationHours;

    @Override
    public String uploadFile(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : ".pdf";
            
            String objectKey = UUID.randomUUID().toString() + extension;
            
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());
            
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    bucketName, objectKey, file.getInputStream(), metadata);
                    
            amazonS3.putObject(putObjectRequest);
            
            log.info("File uploaded successfully to S3: {}", objectKey);
            return objectKey;
        } catch (IOException e) {
            log.error("Error uploading file to S3", e);
            throw new FileUploadException("Error uploading file to secure storage", e);
        }
    }

    @Override
    public String generatePresignedUrl(String objectKey) {
        Date expiration = new Date();
        long expTimeMillis = expiration.getTime();
        expTimeMillis += 1000 * 60 * 60 * presignedUrlExpirationHours;
        expiration.setTime(expTimeMillis);

        GeneratePresignedUrlRequest generatePresignedUrlRequest = 
                new GeneratePresignedUrlRequest(bucketName, objectKey)
                        .withMethod(HttpMethod.GET)
                        .withExpiration(expiration);

        URL url = amazonS3.generatePresignedUrl(generatePresignedUrlRequest);
        return url.toString();
    }

    @Override
    public void deleteFile(String objectKey) {
        if (objectKey != null && !objectKey.isEmpty()) {
            amazonS3.deleteObject(new DeleteObjectRequest(bucketName, objectKey));
            log.info("File deleted from S3: {}", objectKey);
        }
    }
}
