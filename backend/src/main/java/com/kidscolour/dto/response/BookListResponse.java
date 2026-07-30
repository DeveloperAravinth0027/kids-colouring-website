package com.kidscolour.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BookListResponse {
    private Long id;
    private String bookType;
    private String categoryName;
    private String categorySlug;
    private String name;
    private String slug;
    private String shortDescription;
    private String ageGroup;
    private String coverImageUrl;
    private BigDecimal price;
    private Integer discountPercent;
    private BigDecimal finalPrice;
    private Boolean isFeatured;
    private Boolean isFree;
    /** True when a downloadable e-book file is attached. */
    private Boolean hasPdf;
    /** Amazon KDP listing for the printed edition, if published. */
    private String amazonKdpLink;
    private BigDecimal averageRating;
    private Integer reviewCount;
}
