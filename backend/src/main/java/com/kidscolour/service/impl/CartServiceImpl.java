package com.kidscolour.service.impl;

import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Book;
import com.kidscolour.model.CartItem;
import com.kidscolour.model.User;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.CartItemRepository;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookListResponse> getCart(String email) {
        User user = requireUser(email);
        return cartItemRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(item -> mapToBookListResponse(item.getBook()))
                .toList();
    }

    @Override
    @Transactional
    public void addToCart(String email, Long bookId) {
        User user = requireUser(email);
        if (cartItemRepository.existsByUserIdAndBookId(user.getId(), bookId)) {
            return; // already in cart (digital goods: quantity is always 1)
        }
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        cartItemRepository.save(CartItem.builder().user(user).book(book).build());
    }

    @Override
    @Transactional
    public void removeFromCart(String email, Long bookId) {
        User user = requireUser(email);
        cartItemRepository.deleteByUserIdAndBookId(user.getId(), bookId);
    }

    @Override
    @Transactional
    public void clearCart(String email) {
        User user = requireUser(email);
        cartItemRepository.deleteByUserId(user.getId());
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
