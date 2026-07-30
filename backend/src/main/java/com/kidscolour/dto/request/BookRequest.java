package com.kidscolour.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class BookRequest {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    /** COLOURING (default) or STORY. */
    private com.kidscolour.model.enums.BookType bookType = com.kidscolour.model.enums.BookType.COLOURING;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    private String shortDescription;

    @NotBlank(message = "Age group is required")
    private String ageGroup;

    @NotNull(message = "Number of pages is required")
    @Min(value = 1, message = "Number of pages must be at least 1")
    private Integer numPages;

    private String language = "English";

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    private BigDecimal price;

    @NotNull(message = "Discount percent is required")
    @Min(value = 0, message = "Discount cannot be negative")
    private Integer discountPercent;

    private String amazonKdpLink;

    /** An external cover image URL. Uploaded files go through the cover endpoint instead. */
    private String coverImageUrl;

    private Boolean isFeatured = false;

    private Boolean isActive = true;

    private Boolean isFree = false;

    private String seoTitle;

    private String seoDescription;

    private String seoKeywords;

    private List<String> tags;
}
