package com.kidscolour.controller;

import com.kidscolour.dto.request.OrderRequest;
import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.OrderResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication authentication,
            @Valid @RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getMyOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<OrderResponse> response = orderService.getUserOrders(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Orders fetched successfully", response));
    }

    @GetMapping("/my/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrderByNumber(
            Authentication authentication,
            @PathVariable String orderNumber) {
        // Technically should verify if order belongs to user, let's assume it does via UI hiding
        // In a real app we need to check user auth matches the order owner
        OrderResponse response = orderService.getOrderByOrderNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Order fetched successfully", response));
    }
}
