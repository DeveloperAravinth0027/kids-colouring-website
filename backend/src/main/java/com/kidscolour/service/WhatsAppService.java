package com.kidscolour.service;

public interface WhatsAppService {
    void sendOrderConfirmation(String phoneNumber, String orderNumber, String downloadUrl);
}
