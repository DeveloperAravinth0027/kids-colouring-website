package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookListResponse;
import com.kidscolour.dto.response.BookResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    /**
     * Public catalogue responses are identical for every visitor, so let
     * browsers and any CDN in front of us serve them. With 1000 concurrent
     * users this turns a flood of requests into a trickle at the origin.
     */
    private static CacheControl publicCache() {
        return CacheControl.maxAge(Duration.ofSeconds(60))
                .cachePublic()
                .staleWhileRevalidate(Duration.ofSeconds(60));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<BookListResponse>>> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId) {
        
        PagedResponse<BookListResponse> response;
        if (categoryId != null) {
            response = bookService.getBooksByCategory(categoryId, page, size);
        } else {
            response = bookService.getAllBooks(page, size);
        }
        return ResponseEntity.ok().cacheControl(publicCache())
                .body(ApiResponse.success("Books fetched successfully", response));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<PagedResponse<BookListResponse>>> getFeaturedBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookListResponse> response = bookService.getFeaturedBooks(page, size);
        return ResponseEntity.ok().cacheControl(publicCache())
                .body(ApiResponse.success("Featured books fetched successfully", response));
    }

    @GetMapping("/free")
    public ResponseEntity<ApiResponse<PagedResponse<BookListResponse>>> getFreeBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookListResponse> response = bookService.getFreeBooks(page, size);
        return ResponseEntity.ok().cacheControl(publicCache())
                .body(ApiResponse.success("Free books fetched successfully", response));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<BookListResponse>>> searchBooks(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookListResponse> response = bookService.searchBooks(q, page, size);
        return ResponseEntity.ok(ApiResponse.success("Search results fetched successfully", response));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<BookResponse>> getBookBySlug(@PathVariable String slug) {
        BookResponse response = bookService.getBookBySlug(slug);
        return ResponseEntity.ok().cacheControl(publicCache())
                .body(ApiResponse.success("Book fetched successfully", response));
    }
}
