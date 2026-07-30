package com.kidscolour.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesReportResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalBooksSold;
    private Map<String, BigDecimal> revenueByCategory;
    private Map<String, BigDecimal> revenueByDate;
}
