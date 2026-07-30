package com.kidscolour.controller;

import com.kidscolour.dto.request.ReviewRequest;
import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.dto.response.ReviewResponse;
import com.kidscolour.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/books/{bookId}/reviews")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> getBookReviews(
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<ReviewResponse> response = reviewService.getBookReviews(bookId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Reviews fetched successfully", response));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            Authentication authentication,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.createReview(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Review submitted successfully", response));
    }

    @PutMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.updateReview(id, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Review updated successfully", response));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            Authentication authentication) {
        reviewService.deleteReview(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully"));
    }
}
