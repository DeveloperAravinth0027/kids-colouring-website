package com.kidscolour.service;

import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.PagedResponse;

public interface WishlistService {
    PagedResponse<BookListResponse> getUserWishlist(String email, int page, int size);
    void addToWishlist(String email, Long bookId);
    void removeFromWishlist(String email, Long bookId);
    boolean isInWishlist(String email, Long bookId);
}
