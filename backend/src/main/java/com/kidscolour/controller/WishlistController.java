package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<BookListResponse>>> getWishlist(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookListResponse> response = wishlistService.getUserWishlist(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched successfully", response));
    }

    @PostMapping("/{bookId}")
    public ResponseEntity<ApiResponse<Void>> addToWishlist(
            Authentication authentication,
            @PathVariable Long bookId) {
        wishlistService.addToWishlist(authentication.getName(), bookId);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist"));
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            Authentication authentication,
            @PathVariable Long bookId) {
        wishlistService.removeFromWishlist(authentication.getName(), bookId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist"));
    }
    
    @GetMapping("/{bookId}/check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkWishlist(
            Authentication authentication,
            @PathVariable Long bookId) {
        boolean isInWishlist = wishlistService.isInWishlist(authentication.getName(), bookId);
        return ResponseEntity.ok(ApiResponse.success("Checked successfully", Map.of("inWishlist", isInWishlist)));
    }
}
