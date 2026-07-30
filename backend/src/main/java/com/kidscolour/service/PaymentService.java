package com.kidscolour.service;

import com.kidscolour.dto.request.RazorpayOrderRequest;
import com.kidscolour.dto.request.RazorpayVerifyRequest;
import com.kidscolour.dto.response.RazorpayOrderResponse;

public interface PaymentService {
    RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request);
    void verifyRazorpayPayment(RazorpayVerifyRequest request);
    void processWebhook(String payload, String signature);
}
