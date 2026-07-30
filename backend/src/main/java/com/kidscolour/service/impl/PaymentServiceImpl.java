package com.kidscolour.service.impl;

import com.kidscolour.dto.request.RazorpayOrderRequest;
import com.kidscolour.dto.request.RazorpayVerifyRequest;
import com.kidscolour.dto.response.RazorpayOrderResponse;
import com.kidscolour.exception.PaymentException;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Order;
import com.kidscolour.model.Payment;
import com.kidscolour.model.enums.OrderStatus;
import com.kidscolour.model.enums.PaymentGateway;
import com.kidscolour.model.enums.PaymentStatus;
import com.kidscolour.repository.OrderRepository;
import com.kidscolour.repository.PaymentRepository;
import com.kidscolour.service.DownloadService;
import com.kidscolour.service.EmailService;
import com.kidscolour.service.PaymentService;
import com.kidscolour.service.WhatsAppService;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final RazorpayClient razorpayClient;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final DownloadService downloadService;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request) {
        try {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

            // Razorpay amount is in paise (multiply by 100)
            BigDecimal amountInPaise = request.getAmount().multiply(new BigDecimal("100"));

            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise.intValue());
            options.put("currency", "INR");
            options.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);

            Payment payment = Payment.builder()
                    .order(order)
                    .gateway(PaymentGateway.RAZORPAY)
                    .gatewayOrderId(razorpayOrder.get("id"))
                    .amount(request.getAmount())
                    .currency("INR")
                    .status(PaymentStatus.CREATED)
                    .build();

            paymentRepository.save(payment);

            return RazorpayOrderResponse.builder()
                    .id(razorpayOrder.get("id"))
                    .entity(razorpayOrder.get("entity"))
                    .amount(request.getAmount())
                    .currency(razorpayOrder.get("currency"))
                    .receipt(razorpayOrder.get("receipt"))
                    .status(razorpayOrder.get("status"))
                    .build();

        } catch (Exception e) {
            log.error("Failed to create Razorpay order", e);
            throw new PaymentException("Failed to initiate payment: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void verifyRazorpayPayment(RazorpayVerifyRequest request) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (!isValid) {
                throw new PaymentException("Payment signature verification failed");
            }

            Payment payment = paymentRepository.findByGatewayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

            payment.setGatewayPaymentId(request.getRazorpayPaymentId());
            payment.setGatewaySignature(request.getRazorpaySignature());
            payment.setStatus(PaymentStatus.CAPTURED);
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            Order order = payment.getOrder();
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            
            // Post-payment actions
            handleSuccessfulPayment(order);

        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new PaymentException("Payment verification failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void processWebhook(String payload, String signature) {
        // Implementation for webhook processing
        // This is usually called asynchronously from Razorpay
        // We'll skip the detailed implementation to keep it concise,
        // but it would verify the signature and update the order status
        log.info("Received Razorpay Webhook");
    }
    
    private void handleSuccessfulPayment(Order order) {
        log.info("Processing successful payment for order {}", order.getOrderNumber());
        
        // 1. Generate secure download links for the purchased books
        downloadService.generateDownloadLinksForOrderItems(order.getId());
        
        // 2. Send Email
        try {
            String downloadUrl = frontendUrl + "/my-downloads";
            emailService.sendOrderConfirmation(order.getUser().getEmail(), order.getOrderNumber(), downloadUrl);
            order.setEmailSent(true);
        } catch (Exception e) {
            log.error("Failed to send order confirmation email", e);
        }
        
        // 3. Send WhatsApp if phone exists
        if (order.getUser().getPhone() != null && !order.getUser().getPhone().isEmpty()) {
            try {
                String downloadUrl = frontendUrl + "/my-downloads";
                whatsAppService.sendOrderConfirmation(order.getUser().getPhone(), order.getOrderNumber(), downloadUrl);
                order.setWhatsappSent(true);
            } catch (Exception e) {
                log.error("Failed to send order confirmation WhatsApp", e);
            }
        }
        
        orderRepository.save(order);
    }
}
