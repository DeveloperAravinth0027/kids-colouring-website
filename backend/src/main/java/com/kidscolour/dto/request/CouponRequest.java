package com.kidscolour.dto.request;

import com.kidscolour.model.enums.DiscountType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {

    @NotBlank(message = "Code is required")
    private String code;

    private String description;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @Min(value = 0, message = "Discount value cannot be negative")
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    private BigDecimal maxDiscountAmount;

    private Integer maxUses;

    private Boolean isActive = true;

    @NotNull(message = "Valid from date is required")
    private LocalDateTime validFrom;

    private LocalDateTime validUntil;
}
