package com.kidscolour.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Name is required")
    private String name;

    /** COLOURING, STORY or BOTH (defaults to BOTH). */
    private com.kidscolour.model.enums.CategoryScope bookType = com.kidscolour.model.enums.CategoryScope.BOTH;

    private String description;
    
    private String iconUrl;

    private String coverImageUrl;

    private String colorHex;

    /** Emoji icon for the theme (e.g. 🦁). */
    private String emoji;
    
    private Integer sortOrder = 0;
    
    private Boolean isActive = true;
}
