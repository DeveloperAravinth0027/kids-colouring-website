package com.kidscolour.service;

import com.kidscolour.dto.response.BookPageResponse;
import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.model.Book;
import com.kidscolour.model.BookPage;
import com.kidscolour.repository.BookPageRepository;
import com.kidscolour.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Colouring pages for a book: admin uploads line-art images, customers colour
 * them online. Files live on the server's disk (swap for S3 later); the DB keeps
 * the page order + storage key.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookPageService {

    private final BookPageRepository bookPageRepository;
    private final BookRepository bookRepository;
    private final ColoringPageRenderService renderService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Turn an uploaded PDF into this book's online pages.
     *
     * This is the automation that makes one upload do everything: the same PDF
     * customers buy is rendered page-by-page into images, which the Colouring
     * Studio paints on and the Story Reader turns. Replaces any existing pages.
     */
    @Transactional
    public List<BookPageResponse> generatePagesFromPdf(Long bookId, byte[] pdfBytes) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        // Clear whatever was there before (files + rows) so re-uploading is clean.
        List<BookPage> existing = bookPageRepository.findByBookIdOrderByPageNumberAsc(bookId);
        for (BookPage p : existing) {
            deleteQuietly(p.getImageUrl());
            if (p.getThumbnailUrl() != null && !p.getThumbnailUrl().equals(p.getImageUrl())) {
                deleteQuietly(p.getThumbnailUrl());
            }
        }
        bookPageRepository.deleteAll(existing);

        // PDF -> PNG per page, written to disk under uploads/
        List<ColoringPageRenderService.RenderedPage> rendered =
                renderService.process(bookId, pdfBytes, (key, bytes) -> {
                    try {
                        Path target = Paths.get(uploadDir).resolve(key);
                        Files.createDirectories(target.getParent());
                        Files.write(target, bytes);
                        return key; // we store keys, not public URLs
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                });

        List<BookPageResponse> created = new ArrayList<>();
        for (ColoringPageRenderService.RenderedPage rp : rendered) {
            BookPage page = bookPageRepository.save(BookPage.builder()
                    .book(book)
                    .pageNumber(rp.getPageNumber())
                    .imageUrl(rp.getImageUrl())
                    .thumbnailUrl(rp.getThumbnailUrl())
                    .width(rp.getWidth())
                    .height(rp.getHeight())
                    .isPreview(rp.getPageNumber() <= ColoringPageRenderService.PREVIEW_LIMIT_FREE)
                    .build());
            created.add(toResponse(page));
        }

        // Keep the advertised page count honest.
        if (!created.isEmpty()) {
            book.setNumPages(created.size());
            bookRepository.save(book);
        }
        log.info("Book {} — generated {} online page(s) from the uploaded PDF", bookId, created.size());
        return created;
    }

    private void deleteQuietly(String key) {
        try {
            Files.deleteIfExists(Paths.get(uploadDir).resolve(key));
        } catch (IOException e) {
            log.warn("Could not delete {}: {}", key, e.getMessage());
        }
    }

    /** Pages for a book, by slug (used by the Colouring Studio). */
    @Transactional(readOnly = true)
    public List<BookPageResponse> getPagesBySlug(String slug) {
        Book book = bookRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + slug));
        return getPagesByBookId(book.getId());
    }

    @Transactional(readOnly = true)
    public List<BookPageResponse> getPagesByBookId(Long bookId) {
        return bookPageRepository.findByBookIdOrderByPageNumberAsc(bookId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Store uploaded images as the book's next colouring pages. */
    @Transactional
    public List<BookPageResponse> addPages(Long bookId, List<MultipartFile> files) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        int next = (int) bookPageRepository.countByBookId(bookId);
        Path dir = Paths.get(uploadDir, "books", String.valueOf(bookId), "pages");
        Files.createDirectories(dir);

        List<BookPageResponse> created = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only image files are allowed: " + file.getOriginalFilename());
            }

            String ext = switch (contentType) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> ".jpg";
            };
            String key = "books/" + bookId + "/pages/" + UUID.randomUUID() + ext;
            Files.write(Paths.get(uploadDir).resolve(key), file.getBytes());

            next++;
            BookPage page = bookPageRepository.save(BookPage.builder()
                    .book(book)
                    .pageNumber(next)
                    .imageUrl(key)
                    .thumbnailUrl(key)   // same asset; the UI scales it down
                    .isPreview(next <= 3)
                    .build());

            created.add(toResponse(page));
            log.info("Book {} — added colouring page {} ({})", bookId, next, key);
        }
        return created;
    }

    /** Raw bytes for streaming a page image. */
    @Transactional(readOnly = true)
    public byte[] readPageImage(Long pageId) throws IOException {
        BookPage page = bookPageRepository.findById(pageId)
                .orElseThrow(() -> new ResourceNotFoundException("Page not found: " + pageId));
        Path file = Paths.get(uploadDir).resolve(page.getImageUrl());
        if (!Files.exists(file)) throw new ResourceNotFoundException("Page file missing: " + pageId);
        return Files.readAllBytes(file);
    }

    @Transactional
    public void deletePage(Long pageId) {
        BookPage page = bookPageRepository.findById(pageId)
                .orElseThrow(() -> new ResourceNotFoundException("Page not found: " + pageId));
        try {
            Files.deleteIfExists(Paths.get(uploadDir).resolve(page.getImageUrl()));
        } catch (IOException e) {
            log.warn("Could not delete page file {}: {}", page.getImageUrl(), e.getMessage());
        }
        bookPageRepository.delete(page);
    }

    private BookPageResponse toResponse(BookPage p) {
        return BookPageResponse.builder()
                .id(p.getId())
                .pageNumber(p.getPageNumber())
                .imageUrl("/api/coloring/pages/" + p.getId() + "/image")
                .isPreview(p.getIsPreview())
                .build();
    }
}
