package com.kidscolour.controller;

import com.kidscolour.dto.request.RazorpayOrderRequest;
import com.kidscolour.dto.request.RazorpayVerifyRequest;
import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.RazorpayOrderResponse;
import com.kidscolour.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createRazorpayOrder(@Valid @RequestBody RazorpayOrderRequest request) {
        RazorpayOrderResponse response = paymentService.createRazorpayOrder(request);
        return ResponseEntity.ok(ApiResponse.success("Payment order created", response));
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse<Void>> verifyRazorpayPayment(@Valid @RequestBody RazorpayVerifyRequest request) {
        paymentService.verifyRazorpayPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully"));
    }

    @PostMapping("/webhook/razorpay")
    public ResponseEntity<String> handleRazorpayWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {
        paymentService.processWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }
}
