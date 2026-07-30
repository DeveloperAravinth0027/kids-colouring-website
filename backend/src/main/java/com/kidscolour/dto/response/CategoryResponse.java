package com.kidscolour.dto.response;

import lombok.Data;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String slug;
    /** COLOURING, STORY or BOTH. */
    private String bookType;
    private String description;
    private String iconUrl;
    private String coverImageUrl;
    private String colorHex;
    private String emoji;
}
