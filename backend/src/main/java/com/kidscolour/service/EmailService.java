package com.kidscolour.service;

import java.util.Map;

public interface EmailService {
    void sendEmail(String to, String subject, String body);
    void sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> templateModel);
    void sendOrderConfirmation(String to, String orderNumber, String downloadUrl);
    void sendPasswordReset(String to, String resetToken);
}
