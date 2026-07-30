package com.kidscolour.service.impl;

import com.kidscolour.dto.request.OrderRequest;
import com.kidscolour.dto.response.OrderItemResponse;
import com.kidscolour.dto.response.OrderResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.dto.response.PaymentResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.*;
import com.kidscolour.model.enums.OrderStatus;
import com.kidscolour.repository.BookRepository;
import com.kidscolour.repository.CouponRepository;
import com.kidscolour.repository.OrderRepository;
import com.kidscolour.repository.UserRepository;
import com.kidscolour.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final CouponRepository couponRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = new Order();
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setCurrency("INR");
        
        order.setBillingName(request.getBillingName() != null ? request.getBillingName() : user.getName());
        order.setBillingEmail(request.getBillingEmail() != null ? request.getBillingEmail() : user.getEmail());
        order.setBillingPhone(request.getBillingPhone() != null ? request.getBillingPhone() : user.getPhone());
        
        order.setEmailSent(false);
        order.setWhatsappSent(false);
        
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        
        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Book book = bookRepository.findById(itemRequest.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + itemRequest.getBookId()));
                    
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .book(book)
                    .bookName(book.getName())
                    .bookCoverUrl(book.getCoverImageUrl())
                    .unitPrice(book.getFinalPrice())
                    .quantity(itemRequest.getQuantity())
                    .totalPrice(book.getFinalPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())))
                    .build();
                    
            orderItems.add(orderItem);
            subtotal = subtotal.add(orderItem.getTotalPrice());
        }
        
        order.setItems(orderItems);
        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal);
        order.setDiscountAmount(BigDecimal.ZERO);
        
        // Handle coupon if provided
        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            final BigDecimal finalSubtotal = subtotal;
            couponRepository.findByCode(request.getCouponCode().toUpperCase()).ifPresent(coupon -> {
                // Should validate coupon again here to be safe
                order.setCoupon(coupon);
                order.setCouponCode(coupon.getCode());

                BigDecimal discountAmount = calculateDiscount(finalSubtotal, coupon);
                order.setDiscountAmount(discountAmount);
                order.setTotalAmount(finalSubtotal.subtract(discountAmount));
            });
        }
        
        Order savedOrder = orderRepository.save(order);
        return mapToResponse(savedOrder);
    }
    
    private BigDecimal calculateDiscount(BigDecimal subtotal, Coupon coupon) {
        BigDecimal discount = BigDecimal.ZERO;
        switch (coupon.getDiscountType()) {
            case FLAT:
                discount = coupon.getDiscountValue();
                break;
            case PERCENT:
                discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                break;
        }
        
        if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
            discount = coupon.getMaxDiscountAmount();
        }
        
        return discount;
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return mapToResponse(order);
    }

    @Override
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));
        return mapToResponse(order);
    }

    @Override
    public PagedResponse<OrderResponse> getUserOrders(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        return PagedResponse.of(orders.map(this::mapToResponse));
    }

    @Override
    public PagedResponse<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orders = orderRepository.findAll(pageable);
        return PagedResponse.of(orders.map(this::mapToResponse));
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
                
        try {
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            order.setStatus(newStatus);
            Order updatedOrder = orderRepository.save(order);
            return mapToResponse(updatedOrder);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        orderRepository.delete(order);
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderNumber(order.getOrderNumber());
        response.setStatus(order.getStatus().name());
        response.setCustomerName(order.getBillingName());
        response.setCustomerEmail(order.getBillingEmail());
        response.setSubtotal(order.getSubtotal());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setTotalAmount(order.getTotalAmount());
        response.setCouponCode(order.getCouponCode());
        response.setCurrency(order.getCurrency());
        response.setInvoiceUrl(order.getInvoiceUrl());
        response.setCreatedAt(order.getCreatedAt());
        
        List<OrderItemResponse> items = order.getItems().stream().map(item -> {
            OrderItemResponse itemResponse = new OrderItemResponse();
            itemResponse.setId(item.getId());
            itemResponse.setBookId(item.getBook().getId());
            itemResponse.setBookName(item.getBookName());
            itemResponse.setBookCoverUrl(item.getBookCoverUrl());
            itemResponse.setUnitPrice(item.getUnitPrice());
            itemResponse.setQuantity(item.getQuantity());
            itemResponse.setTotalPrice(item.getTotalPrice());
            return itemResponse;
        }).collect(Collectors.toList());
        
        response.setItems(items);
        
        // In a real scenario, you'd fetch payment details as well if needed.
        
        return response;
    }
}
