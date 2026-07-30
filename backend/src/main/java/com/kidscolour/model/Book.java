package com.kidscolour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /** Which product line this book belongs to: colour it, or read it. */
    @Enumerated(EnumType.STRING)
    @Column(name = "book_type", nullable = false, length = 20)
    @Builder.Default
    private com.kidscolour.model.enums.BookType bookType = com.kidscolour.model.enums.BookType.COLOURING;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 300)
    private String slug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(name = "age_group", nullable = false, length = 50)
    private String ageGroup;

    @Column(name = "num_pages", nullable = false)
    private Integer numPages;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "pdf_s3_key", length = 500)
    private String pdfS3Key;

    @Column(name = "pdf_size_mb", precision = 6, scale = 2)
    private BigDecimal pdfSizeMb;

    @Column(name = "preview_pdf_url", length = 500)
    private String previewPdfUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(name = "final_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @Column(name = "amazon_kdp_link", length = 1000)
    private String amazonKdpLink;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_free", nullable = false)
    private Boolean isFree;

    @Column(name = "total_downloads", nullable = false)
    private Integer totalDownloads;

    @Column(name = "total_sales", nullable = false)
    private Integer totalSales;

    @Column(name = "average_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @Column(name = "seo_title", length = 255)
    private String seoTitle;

    @Column(name = "seo_description", length = 500)
    private String seoDescription;

    @Column(name = "seo_keywords", length = 500)
    private String seoKeywords;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
