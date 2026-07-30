package com.kidscolour.service;

import com.kidscolour.dto.request.OrderRequest;
import com.kidscolour.dto.response.OrderResponse;
import com.kidscolour.dto.response.PagedResponse;

public interface OrderService {
    OrderResponse createOrder(String email, OrderRequest request);
    OrderResponse getOrderById(Long id);
    OrderResponse getOrderByOrderNumber(String orderNumber);
    PagedResponse<OrderResponse> getUserOrders(String email, int page, int size);
    PagedResponse<OrderResponse> getAllOrders(int page, int size);
    OrderResponse updateOrderStatus(Long id, String status);
    void deleteOrder(Long id);
}
