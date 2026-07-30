package com.kidscolour.service;

import com.kidscolour.dto.response.BookListResponse;

import java.util.List;

public interface CartService {
    List<BookListResponse> getCart(String email);
    void addToCart(String email, Long bookId);
    void removeFromCart(String email, Long bookId);
    void clearCart(String email);
}
