package com.kidscolour.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class BookResponse {
    private Long id;
    private String bookType;
    private CategoryResponse category;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private String ageGroup;
    private Integer numPages;
    private String language;
    private String coverImageUrl;
    private BigDecimal pdfSizeMb;
    private String previewPdfUrl;
    private BigDecimal price;
    private Integer discountPercent;
    private BigDecimal finalPrice;
    private String amazonKdpLink;
    private Boolean isFeatured;
    private Boolean isActive;
    private Boolean isFree;
    /** True when a downloadable e-book file is attached. */
    private Boolean hasPdf;
    private Integer totalDownloads;
    private Integer totalSales;
    private BigDecimal averageRating;
    private Integer reviewCount;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private List<String> previewImages;
    private List<String> tags;
}
