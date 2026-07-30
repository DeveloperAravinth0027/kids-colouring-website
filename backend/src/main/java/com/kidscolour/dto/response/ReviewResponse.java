package com.kidscolour.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReviewResponse {
    private Long id;
    private Long bookId;
    private String userName;
    private String userAvatarUrl;
    private Integer rating;
    private String title;
    private String body;
    private Boolean isVerifiedPurchase;
    private LocalDateTime createdAt;
}
