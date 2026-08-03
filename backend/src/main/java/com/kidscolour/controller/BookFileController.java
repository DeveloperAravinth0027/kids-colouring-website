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
        // 1) Store the sellable PDF synchronously — fast and reliable.
        String key = bookFileService.uploadPdf(bookId, file);

        // 2) Render the online colouring pages in the BACKGROUND. Rendering is
        //    slow and memory-heavy on a small container and would otherwise blow
        //    the request/proxy timeout, failing the upload with "Could not save
        //    the book". Read the bytes now (the upload is cleaned up once the
        //    request returns) and hand them to a worker thread. The PDF is already
        //    saved and downloadable regardless of whether rendering succeeds.
        final byte[] pdfBytes = file.getBytes();
        new Thread(() -> {
            try {
                int n = bookPageService.generatePagesFromPdf(bookId, pdfBytes).size();
                log.info("Book {} — background render produced {} online page(s)", bookId, n);
            } catch (Throwable e) {
                log.error("Book {} — background page rendering failed (PDF is still saved)", bookId, e);
            }
        }, "pdf-render-" + bookId).start();

        Map<String, Object> data = new HashMap<>();
        data.put("key", key);
        data.put("fileName", file.getOriginalFilename());
        data.put("size", file.getSize());
        data.put("pagesQueued", true);

        return ResponseEntity.ok(ApiResponse.success(
                "PDF uploaded — it's downloadable now; online colouring pages are being prepared in the background.",
                data));
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
