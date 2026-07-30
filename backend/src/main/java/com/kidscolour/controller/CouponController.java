package com.kidscolour.controller;

import com.kidscolour.dto.request.CouponApplyRequest;
import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.CouponResponse;
import com.kidscolour.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<CouponResponse>> applyCoupon(@Valid @RequestBody CouponApplyRequest request) {
        CouponResponse response = couponService.validateAndApplyCoupon(request);
        return ResponseEntity.ok(ApiResponse.success("Coupon applied successfully", response));
    }
}
