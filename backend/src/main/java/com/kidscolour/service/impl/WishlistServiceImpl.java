package com.kidscolour.service.impl;

import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Book;
import com.kidscolour.model.User;
import com.kidscolour.model.Wishlist;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.repository.WishlistRepository;
import com.kidscolour.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Override
    public PagedResponse<BookListResponse> getUserWishlist(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        Pageable pageable = PageRequest.of(page, size);
        Page<Wishlist> wishlist = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        
        Page<BookListResponse> responses = wishlist.map(w -> mapToBookListResponse(w.getBook()));
        return PagedResponse.of(responses);
    }

    @Override
    @Transactional
    public void addToWishlist(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        if (wishlistRepository.existsByUserIdAndBookId(user.getId(), bookId)) {
            return; // Already in wishlist
        }
        
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
                
        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .book(book)
                .build();
                
        wishlistRepository.save(wishlist);
    }

    @Override
    @Transactional
    public void removeFromWishlist(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        wishlistRepository.deleteByUserIdAndBookId(user.getId(), bookId);
    }

    @Override
    public boolean isInWishlist(String email, Long bookId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        return wishlistRepository.existsByUserIdAndBookId(user.getId(), bookId);
    }
    
    private BookListResponse mapToBookListResponse(Book book) {
        BookListResponse response = new BookListResponse();
        response.setId(book.getId());
        response.setCategoryName(book.getCategory().getName());
        response.setCategorySlug(book.getCategory().getSlug());
        response.setName(book.getName());
        response.setSlug(book.getSlug());
        response.setShortDescription(book.getShortDescription());
        response.setAgeGroup(book.getAgeGroup());
        response.setCoverImageUrl(book.getCoverImageUrl());
        response.setPrice(book.getPrice());
        response.setDiscountPercent(book.getDiscountPercent());
        response.setFinalPrice(book.getFinalPrice());
        response.setIsFeatured(book.getIsFeatured());
        response.setIsFree(book.getIsFree());
        response.setAverageRating(book.getAverageRating());
        response.setReviewCount(book.getReviewCount());
        return response;
    }
}
