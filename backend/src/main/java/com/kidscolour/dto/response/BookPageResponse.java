package com.kidscolour.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookPageResponse {
    private Long id;
    private Integer pageNumber;
    /** Public endpoint that streams the page image. */
    private String imageUrl;
    private Boolean isPreview;
}
