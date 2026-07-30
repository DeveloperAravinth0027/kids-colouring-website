package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.dto.response.BookPageResponse;
import com.kidscolour.service.BookPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Admin management of a book's colouring pages.
 * Secured by the /api/admin/** rule (ROLE_ADMIN) in SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin/books/{bookId}/pages")
@RequiredArgsConstructor
public class AdminColoringPageController {

    private final BookPageService bookPageService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookPageResponse>>> list(@PathVariable Long bookId) {
        return ResponseEntity.ok(ApiResponse.success("Pages fetched successfully",
                bookPageService.getPagesByBookId(bookId)));
    }

    /** Upload one or more line-art images; each becomes a colouring page. */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<List<BookPageResponse>>> upload(
            @PathVariable Long bookId,
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        List<BookPageResponse> created = bookPageService.addPages(bookId, files);
        return ResponseEntity.ok(ApiResponse.success(created.size() + " page(s) uploaded", created));
    }

    @DeleteMapping("/{pageId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long bookId, @PathVariable Long pageId) {
        bookPageService.deletePage(pageId);
        return ResponseEntity.ok(ApiResponse.success("Page deleted"));
    }
}
