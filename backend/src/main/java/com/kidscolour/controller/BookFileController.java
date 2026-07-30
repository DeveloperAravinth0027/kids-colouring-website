package com.kidscolour.controller;

import com.kidscolour.dto.response.ApiResponse;
import com.kidscolour.service.BookFileService;
import com.kidscolour.service.BookPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class BookFileController {

    private final BookFileService bookFileService;
    private final BookPageService bookPageService;

    /**
     * Admin: upload the book's PDF.
     *
     * One upload, two jobs: the file becomes the sellable download AND every
     * page is rendered into the online pages customers colour / read.
     */
    @PostMapping(value = "/api/admin/books/{bookId}/pdf", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadPdf(
            @PathVariable Long bookId,
            @RequestParam("file") MultipartFile file) throws IOException {
        String key = bookFileService.uploadPdf(bookId, file);

        int pages = 0;
        String warning = null;
        try {
            pages = bookPageService.generatePagesFromPdf(bookId, file.getBytes()).size();
        } catch (Exception e) {
            // The sellable PDF is safely stored either way — only the online
            // pages failed, so say so instead of failing the whole upload.
            log.error("PDF stored for book {} but page rendering failed", bookId, e);
            warning = "The PDF was saved, but its pages could not be converted for online use.";
        }

        Map<String, Object> data = new HashMap<>();
        data.put("key", key);
        data.put("fileName", file.getOriginalFilename());
        data.put("size", file.getSize());
        data.put("pagesGenerated", pages);
        if (warning != null) data.put("warning", warning);

        return ResponseEntity.ok(ApiResponse.success(
                warning != null ? warning : "PDF uploaded — " + pages + " online page(s) created", data));
    }

    /** Admin: upload/replace a book's cover image. */
    @PostMapping(value = "/api/admin/books/{bookId}/cover", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadCover(
            @PathVariable Long bookId,
            @RequestParam("file") MultipartFile file) throws IOException {
        String url = bookFileService.uploadCover(bookId, file);
        return ResponseEntity.ok(ApiResponse.success("Cover uploaded", Map.of("url", url)));
    }

    /** Public: stream a book's cover image (used everywhere the cover shows). */
    @GetMapping("/api/files/books/{bookId}/cover")
    public ResponseEntity<byte[]> cover(@PathVariable Long bookId) throws IOException {
        BookFileService.CoverImage img = bookFileService.readCover(bookId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, img.contentType())
                .cacheControl(org.springframework.http.CacheControl.maxAge(java.time.Duration.ofDays(30)).cachePublic())
                .body(img.bytes());
    }

    /** Is a PDF attached? (public — lets the UI show/hide the download button) */
    @GetMapping("/api/books/{bookId}/pdf/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> pdfStatus(@PathVariable Long bookId) {
        return ResponseEntity.ok(ApiResponse.success("ok",
                Map.of("hasPdf", bookFileService.hasPdf(bookId))));
    }

    /** Customer: download the PDF they own. */
    @GetMapping("/api/files/books/{bookId}/pdf")
    public ResponseEntity<byte[]> download(Authentication authentication, @PathVariable Long bookId) throws IOException {
        byte[] bytes = bookFileService.downloadPdf(authentication.getName(), bookId);
        String fileName = bookFileService.fileNameFor(bookId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(bytes);
    }
}
