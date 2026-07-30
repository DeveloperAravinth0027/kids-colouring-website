package com.kidscolour.service.impl;

import com.kidscolour.dto.request.CouponApplyRequest;
import com.kidscolour.dto.request.CouponRequest;
import com.kidscolour.dto.response.CouponResponse;
import com.kidscolour.dto.response.PagedResponse;
import com.kidscolour.exception.CouponException;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Coupon;
import com.kidscolour.repository.CouponRepository;
import com.kidscolour.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    @Override
    public PagedResponse<CouponResponse> getAllCoupons(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Coupon> coupons = couponRepository.findAll(pageable);
        return PagedResponse.of(coupons.map(this::mapToResponse));
    }

    @Override
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        return mapToResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.findByCode(request.getCode().toUpperCase()).isPresent()) {
            throw new CouponException("Coupon code already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .maxUses(request.getMaxUses())
                .usedCount(0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .build();

        Coupon savedCoupon = couponRepository.save(coupon);
        return mapToResponse(savedCoupon);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));

        if (!coupon.getCode().equalsIgnoreCase(request.getCode())) {
            if (couponRepository.findByCode(request.getCode().toUpperCase()).isPresent()) {
                throw new CouponException("Coupon code already exists");
            }
            coupon.setCode(request.getCode().toUpperCase());
        }

        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setMaxUses(request.getMaxUses());
        
        if (request.getIsActive() != null) coupon.setIsActive(request.getIsActive());
        
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidUntil(request.getValidUntil());

        Coupon updatedCoupon = couponRepository.save(coupon);
        return mapToResponse(updatedCoupon);
    }

    @Override
    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
        couponRepository.delete(coupon);
    }

    @Override
    public CouponResponse validateAndApplyCoupon(CouponApplyRequest request) {
        Coupon coupon = couponRepository.findByCode(request.getCode().toUpperCase())
                .orElseThrow(() -> new CouponException("Invalid coupon code"));

        validateCoupon(coupon, request.getOrderAmount());

        return mapToResponse(coupon);
    }

    private void validateCoupon(Coupon coupon, java.math.BigDecimal orderAmount) {
        if (!coupon.getIsActive()) {
            throw new CouponException("Coupon is not active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom())) {
            throw new CouponException("Coupon is not valid yet");
        }
        
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new CouponException("Coupon has expired");
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new CouponException("Coupon usage limit exceeded");
        }

        if (orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new CouponException("Order amount must be at least " + coupon.getMinOrderAmount() + " to use this coupon");
        }
    }

    private CouponResponse mapToResponse(Coupon coupon) {
        CouponResponse response = new CouponResponse();
        response.setId(coupon.getId());
        response.setCode(coupon.getCode());
        response.setDescription(coupon.getDescription());
        response.setDiscountType(coupon.getDiscountType().name());
        response.setDiscountValue(coupon.getDiscountValue());
        response.setMinOrderAmount(coupon.getMinOrderAmount());
        response.setMaxDiscountAmount(coupon.getMaxDiscountAmount());
        response.setMaxUses(coupon.getMaxUses());
        response.setUsedCount(coupon.getUsedCount());
        response.setIsActive(coupon.getIsActive());
        response.setValidFrom(coupon.getValidFrom());
        response.setValidUntil(coupon.getValidUntil());
        return response;
    }
}
