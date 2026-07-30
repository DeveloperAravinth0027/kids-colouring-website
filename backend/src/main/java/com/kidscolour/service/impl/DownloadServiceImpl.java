package com.kidscolour.service.impl;

import com.kidscolour.dto.response.DownloadResponse;
import com.kidscolour.exception.DownloadException;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Download;
import com.kidscolour.model.Order;
import com.kidscolour.model.OrderItem;
import com.kidscolour.model.User;
import com.kidscolour.repository.DownloadRepository;
import com.kidscolour.repository.OrderRepository;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.service.DownloadService;
import com.kidscolour.service.S3Service;
import com.kidscolour.util.DownloadLinkUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DownloadServiceImpl implements DownloadService {

    private final DownloadRepository downloadRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;

    @Value("${app.aws.s3.download-link-expiration-hours}")
    private int downloadLinkExpirationHours;
    
    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    @Transactional
    public String getSecureDownloadUrl(String token, String userEmail, String ipAddress) {
        Download download = downloadRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid download token"));

        if (!download.getUser().getEmail().equals(userEmail)) {
            throw new DownloadException("You are not authorized to download this file");
        }

        if (download.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new DownloadException("Download link has expired");
        }

        if (download.getDownloadCount() >= download.getMaxDownloads()) {
            throw new DownloadException("Download limit exceeded");
        }

        // Update download metrics
        download.setDownloadCount(download.getDownloadCount() + 1);
        download.setLastDownloaded(LocalDateTime.now());
        download.setIpAddress(ipAddress);
        downloadRepository.save(download);

        // Generate S3 presigned URL for the actual PDF
        String s3Key = download.getBook().getPdfS3Key();
        if (s3Key == null || s3Key.isEmpty()) {
            throw new ResourceNotFoundException("PDF file not found for this book");
        }

        return s3Service.generatePresignedUrl(s3Key);
    }

    @Override
    public List<DownloadResponse> getUserDownloads(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Download> downloads = downloadRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        return downloads.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void generateDownloadLinksForOrderItems(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        for (OrderItem item : order.getItems()) {
            // Check if download link already exists for this order item
            List<Download> existingDownloads = downloadRepository.findByOrderItemId(item.getId());
            if (existingDownloads.isEmpty()) {
                String token = DownloadLinkUtil.generateToken();
                LocalDateTime expiresAt = LocalDateTime.now().plusHours(downloadLinkExpirationHours);
                
                Download download = Download.builder()
                        .orderItem(item)
                        .user(order.getUser())
                        .book(item.getBook())
                        .token(token)
                        .downloadCount(0)
                        .maxDownloads(10) // Allow up to 10 downloads per purchase
                        .expiresAt(expiresAt)
                        .build();
                        
                downloadRepository.save(download);
                log.info("Generated download link for book ID {} to user ID {}", item.getBook().getId(), order.getUser().getId());
            }
        }
    }
    
    private DownloadResponse mapToResponse(Download download) {
        DownloadResponse response = new DownloadResponse();
        response.setToken(download.getToken());
        response.setBookId(download.getBook().getId());
        response.setBookName(download.getBook().getName());
        response.setDownloadCount(download.getDownloadCount());
        response.setMaxDownloads(download.getMaxDownloads());
        response.setExpiresAt(download.getExpiresAt());
        
        // Return a proxy URL via our backend to handle the download security checks
        String downloadUrl = frontendUrl + "/download/" + download.getToken();
        response.setDownloadUrl(downloadUrl);
        
        return response;
    }
}
