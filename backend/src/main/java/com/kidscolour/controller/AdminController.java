package com.kidscolour.controller;

import com.kidscolour.dto.request.BookRequest;
import com.kidscolour.dto.request.CategoryRequest;
import com.kidscolour.dto.request.CouponRequest;
import com.kidscolour.dto.response.*;
import com.kidscolour.service.BookService;
import com.kidscolour.service.CategoryService;
import com.kidscolour.service.CouponService;
import com.kidscolour.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final BookService bookService;
    private final CategoryService categoryService;
    private final OrderService orderService;
    private final CouponService couponService;

    // Books
    @PostMapping("/books")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(@Valid @RequestBody BookRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Book created successfully", bookService.createBook(request)));
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Book updated successfully", bookService.updateBook(id, request)));
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        // Sold books are archived rather than erased — the message says which.
        return ResponseEntity.ok(ApiResponse.success(bookService.deleteBook(id)));
    }

    @PostMapping(value = "/books/{id}/upload-cover", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BookResponse>> uploadCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Cover uploaded", bookService.uploadCover(id, file)));
    }

    @PostMapping(value = "/books/{id}/upload-pdf", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BookResponse>> uploadPdf(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("PDF uploaded", bookService.uploadPdf(id, file)));
    }

    @PostMapping(value = "/books/{id}/upload-preview-pdf", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<BookResponse>> uploadPreviewPdf(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Preview PDF uploaded", bookService.uploadPreviewPdf(id, file)));
    }

    // Categories
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category created", categoryService.createCategory(request)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", categoryService.updateCategory(id, request)));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        // Categories still holding books are archived rather than erased.
        return ResponseEntity.ok(ApiResponse.success(categoryService.deleteCategory(id)));
    }

    // Orders
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Orders fetched", orderService.getAllOrders(page, size)));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success("Status updated", orderService.updateOrderStatus(id, status)));
    }

    // Coupons
    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<PagedResponse<CouponResponse>>> getAllCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Coupons fetched", couponService.getAllCoupons(page, size)));
    }

    @PostMapping("/coupons")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon created", couponService.createCoupon(request)));
    }

    @PutMapping("/coupons/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Coupon updated", couponService.updateCoupon(id, request)));
    }
}
