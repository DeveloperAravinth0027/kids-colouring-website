package com.kidscolour.service;

import com.kidscolour.dto.request.CouponApplyRequest;
import com.kidscolour.dto.request.CouponRequest;
import com.kidscolour.dto.response.CouponResponse;
import com.kidscolour.dto.response.PagedResponse;

public interface CouponService {
    PagedResponse<CouponResponse> getAllCoupons(int page, int size);
    CouponResponse getCouponById(Long id);
    CouponResponse createCoupon(CouponRequest request);
    CouponResponse updateCoupon(Long id, CouponRequest request);
    void deleteCoupon(Long id);
    CouponResponse validateAndApplyCoupon(CouponApplyRequest request);
}
