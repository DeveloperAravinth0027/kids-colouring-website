package com.kidscolour.service.impl;

import com.kidscolour.model.WhatsAppLog;
import com.kidscolour.model.enums.WhatsAppStatus;
import com.kidscolour.repository.WhatsAppLogRepository;
import com.kidscolour.service.WhatsAppService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppServiceImpl implements WhatsAppService {

    private final WhatsAppLogRepository whatsAppLogRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.whatsapp.phone-number-id}")
    private String phoneNumberId;

    @Value("${app.whatsapp.access-token}")
    private String accessToken;
    
    @Value("${app.whatsapp.api-version}")
    private String apiVersion;

    @Value("${app.whatsapp.api-url}")
    private String apiUrl;

    @Async
    @Override
    public void sendOrderConfirmation(String phoneNumber, String orderNumber, String downloadUrl) {
        WhatsAppLog logEntry = WhatsAppLog.builder()
                .phoneNumber(phoneNumber)
                .templateName("order_confirmation")
                .status(WhatsAppStatus.PENDING)
                .build();
                
        logEntry = whatsAppLogRepository.save(logEntry);

        try {
            String url = apiUrl + "/" + apiVersion + "/" + phoneNumberId + "/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            // Formatting phone number to required format (no + sign, just country code and number)
            String formattedPhone = phoneNumber.replaceAll("[^0-9]", "");

            // Constructing WhatsApp Cloud API payload
            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", formattedPhone);
            body.put("type", "template");
            
            Map<String, Object> template = new HashMap<>();
            template.put("name", "order_confirmation"); // Must match template name in Meta Business Manager
            
            Map<String, Object> language = new HashMap<>();
            language.put("code", "en");
            template.put("language", language);
            
            // Parameters for the template (e.g., {{1}} for orderNumber, {{2}} for downloadUrl)
            Map<String, Object> parameter1 = new HashMap<>();
            parameter1.put("type", "text");
            parameter1.put("text", orderNumber);
            
            Map<String, Object> parameter2 = new HashMap<>();
            parameter2.put("type", "text");
            parameter2.put("text", downloadUrl);
            
            Map<String, Object> component = new HashMap<>();
            component.put("type", "body");
            component.put("parameters", List.of(parameter1, parameter2));
            
            template.put("components", List.of(component));
            body.put("template", template);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Parse message ID
                List<Map<String, Object>> messages = (List<Map<String, Object>>) response.getBody().get("messages");
                if (messages != null && !messages.isEmpty()) {
                    String messageId = (String) messages.get(0).get("id");
                    logEntry.setMessageId(messageId);
                }
                
                logEntry.setStatus(WhatsAppStatus.SENT);
                logEntry.setSentAt(LocalDateTime.now());
                log.info("WhatsApp order confirmation sent to {}", formattedPhone);
            } else {
                logEntry.setStatus(WhatsAppStatus.FAILED);
                logEntry.setErrorMsg("Non-200 response from Meta API");
                log.error("Failed to send WhatsApp message. Response: {}", response.getBody());
            }

        } catch (Exception e) {
            logEntry.setStatus(WhatsAppStatus.FAILED);
            logEntry.setErrorMsg(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 1000)) : "Unknown error");
            log.error("Error sending WhatsApp message to {}", phoneNumber, e);
        }
        
        whatsAppLogRepository.save(logEntry);
    }
}
