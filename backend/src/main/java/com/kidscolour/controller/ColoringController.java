package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookPageResponse;
import com.kidscolour.service.BookPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * Public read side of the Online Colouring System.
 * Admin uploads pages; these endpoints feed the Colouring Studio.
 */
@RestController
@RequestMapping("/api/coloring")
@RequiredArgsConstructor
public class ColoringController {

    private final BookPageService bookPageService;

    @GetMapping("/{slug}/pages")
    public ResponseEntity<ApiResponse<List<BookPageResponse>>> getPages(@PathVariable String slug) {
        List<BookPageResponse> pages = bookPageService.getPagesBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Pages fetched successfully", pages));
    }

    @GetMapping("/pages/{id}/image")
    public ResponseEntity<byte[]> getPageImage(@PathVariable Long id) throws IOException {
        byte[] bytes = bookPageService.readPageImage(id);
        return ResponseEntity.ok()
                .contentType(sniffImageType(bytes))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(bytes);
    }

    /** Detect the image type from magic bytes so PNG/WebP/JPEG all serve correctly. */
    private static MediaType sniffImageType(byte[] b) {
        if (b != null && b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return MediaType.valueOf("image/webp");
        }
        if (b != null && b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) {
            return MediaType.IMAGE_JPEG;
        }
        return MediaType.IMAGE_PNG;
    }
}
