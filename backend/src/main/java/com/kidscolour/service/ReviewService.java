package com.kidscolour.service;

import com.kidscolour.dto.request.ReviewRequest;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.dto.response.ReviewResponse;

public interface ReviewService {
    PagedResponse<ReviewResponse> getBookReviews(Long bookId, int page, int size);
    ReviewResponse getReviewById(Long id);
    ReviewResponse createReview(String email, ReviewRequest request);
    ReviewResponse updateReview(Long id, String email, ReviewRequest request);
    void deleteReview(Long id, String email);
    ReviewResponse approveReview(Long id); // For admin
}
