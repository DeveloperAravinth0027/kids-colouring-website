package com.kidscolour.service.impl;

import com.kidscolour.dto.request.ReviewRequest;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.dto.response.ReviewResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.exception.UnauthorizedException;
import com.kidscolour.model.Book;
import com.kidscolour.model.Review;
import com.kidscolour.model.User;
import com.kidscolour.model.enums.UserRole;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.ReviewRepository;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Override
    public PagedResponse<ReviewResponse> getBookReviews(Long bookId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewRepository.findByBookIdAndIsApprovedTrue(bookId, pageable);
        return PagedResponse.of(reviews.map(this::mapToResponse));
    }

    @Override
    public ReviewResponse getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
        return mapToResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse createReview(String email, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + request.getBookId()));
                
        // Check if user already reviewed this book
        if (reviewRepository.findByUserIdAndBookId(user.getId(), book.getId()).isPresent()) {
            throw new IllegalArgumentException("You have already reviewed this book");
        }
        
        Review review = Review.builder()
                .book(book)
                .user(user)
                .rating(request.getRating())
                .title(request.getTitle())
                .body(request.getBody())
                .isApproved(true) // Auto-approve for now, can be changed to false for manual moderation
                .isFeatured(false)
                .build();
                
        Review savedReview = reviewRepository.save(review);
        
        updateBookRating(book);
        
        return mapToResponse(savedReview);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, String email, ReviewRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
                
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (!review.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedException("You are not authorized to update this review");
        }
        
        review.setRating(request.getRating());
        review.setTitle(request.getTitle());
        review.setBody(request.getBody());
        // review.setIsApproved(false); // Can be set to false requiring re-approval
        
        Review updatedReview = reviewRepository.save(review);
        
        updateBookRating(review.getBook());
        
        return mapToResponse(updatedReview);
    }

    @Override
    @Transactional
    public void deleteReview(Long id, String email) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
                
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (!review.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new UnauthorizedException("You are not authorized to delete this review");
        }
        
        Book book = review.getBook();
        reviewRepository.delete(review);
        
        updateBookRating(book);
    }

    @Override
    @Transactional
    public ReviewResponse approveReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
                
        review.setIsApproved(true);
        Review updatedReview = reviewRepository.save(review);
        
        updateBookRating(review.getBook());
        
        return mapToResponse(updatedReview);
    }
    
    private void updateBookRating(Book book) {
        // Fetch all approved reviews for this book
        // In a real app, this should be an aggregation query in the repository for performance
        Page<Review> reviews = reviewRepository.findByBookIdAndIsApprovedTrue(book.getId(), PageRequest.of(0, Integer.MAX_VALUE));
        
        if (reviews.isEmpty()) {
            book.setAverageRating(BigDecimal.ZERO);
            book.setReviewCount(0);
        } else {
            long count = reviews.getTotalElements();
            double sum = reviews.getContent().stream().mapToDouble(Review::getRating).sum();
            double average = sum / count;
            
            book.setAverageRating(BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
            book.setReviewCount((int) count);
        }
        
        bookRepository.save(book);
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setBookId(review.getBook().getId());
        response.setUserName(review.getUser().getName());
        response.setUserAvatarUrl(review.getUser().getAvatarUrl());
        response.setRating(review.getRating());
        response.setTitle(review.getTitle());
        response.setBody(review.getBody());
        response.setIsVerifiedPurchase(review.getOrder() != null);
        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}
