package com.kidscolour.service.impl;

import com.kidscolour.model.EmailLog;
import com.kidscolour.model.enums.EmailStatus;
import com.kidscolour.repository.EmailLogRepository;
import com.kidscolour.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final EmailLogRepository emailLogRepository;

    @Value("${app.email.from-address}")
    private String fromAddress;
    
    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    @Override
    public void sendEmail(String to, String subject, String body) {
        sendHtmlEmail(to, subject, body, null);
    }

    @Async
    @Override
    public void sendTemplateEmail(String to, String subject, String templateName, Map<String, Object> templateModel) {
        Context context = new Context();
        context.setVariables(templateModel);
        String htmlBody = templateEngine.process(templateName, context);
        sendHtmlEmail(to, subject, htmlBody, templateName);
    }

    @Override
    public void sendOrderConfirmation(String to, String orderNumber, String downloadUrl) {
        Map<String, Object> model = new HashMap<>();
        model.put("orderNumber", orderNumber);
        model.put("downloadUrl", downloadUrl);
        model.put("storeName", "Kids Colouring Book");
        
        sendTemplateEmail(to, "Order Confirmation - " + orderNumber, "order-confirmation", model);
    }

    @Override
    public void sendPasswordReset(String to, String resetToken) {
        Map<String, Object> model = new HashMap<>();
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
        model.put("resetUrl", resetUrl);
        
        sendTemplateEmail(to, "Password Reset Request", "password-reset", model);
    }
    
    private void sendHtmlEmail(String to, String subject, String htmlBody, String templateName) {
        EmailLog emailLog = EmailLog.builder()
                .toEmail(to)
                .subject(subject)
                .template(templateName)
                .status(EmailStatus.PENDING)
                .build();
                
        emailLog = emailLogRepository.save(emailLog);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            
            mailSender.send(message);
            
            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());
            emailLogRepository.save(emailLog);
            
            log.info("Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMsg(e.getMessage());
            emailLogRepository.save(emailLog);
        }
    }
}
