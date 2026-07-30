package com.kidscolour.model;

import com.kidscolour.model.enums.WhatsAppStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "whatsapp_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "template_name", length = 100)
    private String templateName;

    @Column(name = "message_id", length = 255)
    private String messageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WhatsAppStatus status;

    @Column(name = "error_msg", length = 1000)
    private String errorMsg;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
