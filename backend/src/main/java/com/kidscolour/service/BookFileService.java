package com.kidscolour.service;

import com.kidscolour.exception.ResourceNotFoundException;
import com.kidscolour.exception.UnauthorizedException;
import com.kidscolour.model.Book;
import com.kidscolour.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * The sellable e-book file for a book.
 *
 * Stores the PDF on the server's disk (the same pattern S3 would use — swap the
 * two Files calls for an S3 client when credentials are available) and serves it
 * only to customers who actually own the book.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookFileService {

    private final BookRepository bookRepository;
    private final BookAccessService bookAccessService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /** A cover image plus the media type to serve it with. */
    public record CoverImage(byte[] bytes, String contentType) {}

    /**
     * Admin: store a book's cover image on disk.
     *
     * Covers can be any size, so they can't live in the 500-char DB column — we
     * keep the file on disk and store only a short served URL. A cache-busting
     * version keeps browsers from showing a stale cover after a replace.
     */
    @org.springframework.cache.annotation.Caching(evict = {
        @org.springframework.cache.annotation.CacheEvict(value = "books", allEntries = true),
        @org.springframework.cache.annotation.CacheEvict(value = "bookDetail", allEntries = true)
    })
    @Transactional
    public String uploadCover(Long bookId, MultipartFile file) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        String type = file.getContentType();
        if (type == null || !type.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }
        Path target = Paths.get(uploadDir).resolve("books/" + bookId + "/cover.img");
        Files.createDirectories(target.getParent());
        Files.write(target, file.getBytes());

        String url = "/api/files/books/" + bookId + "/cover?v=" + System.currentTimeMillis();
        book.setCoverImageUrl(url);
        bookRepository.save(book);
        log.info("Book {} — cover stored ({} bytes)", bookId, file.getSize());
        return url;
    }

    @Transactional(readOnly = true)
    public CoverImage readCover(Long bookId) throws IOException {
        Path file = Paths.get(uploadDir).resolve("books/" + bookId + "/cover.img");
        if (!Files.exists(file)) throw new ResourceNotFoundException("No cover for this book");
        byte[] bytes = Files.readAllBytes(file);
        return new CoverImage(bytes, sniffImageType(bytes));
    }

    /** Detect the image type from its first bytes so we serve the right MIME. */
    private String sniffImageType(byte[] b) {
        if (b.length > 3 && (b[0] & 0xFF) == 0x89 && b[1] == 0x50) return "image/png";
        if (b.length > 2 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) return "image/jpeg";
        if (b.length > 11 && b[0] == 0x52 && b[1] == 0x49 && b[2] == 0x46 && b[3] == 0x46) return "image/webp";
        return "image/jpeg";
    }

    /** Admin: attach/replace the PDF customers download after buying. */
    @Transactional
    public String uploadPdf(Long bookId, MultipartFile file) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        String type = file.getContentType();
        if ((type == null || !type.equals("application/pdf"))
                && (file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".pdf"))) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        String key = "books/" + bookId + "/book.pdf";
        Path target = Paths.get(uploadDir).resolve(key);
        Files.createDirectories(target.getParent());
        byte[] pdfBytes = file.getBytes();
        Files.write(target, pdfBytes);

        book.setPdfS3Key(key);
        book.setPdfSizeMb(BigDecimal.valueOf(file.getSize())
                .divide(BigDecimal.valueOf(1024 * 1024), 2, RoundingMode.HALF_UP));

        // Count the PDF's pages so the catalogue shows an accurate page count
        // instead of 0. Best-effort — a page count is not worth failing the upload.
        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            book.setNumPages(doc.getNumberOfPages());
        } catch (Exception e) {
            log.warn("Could not count PDF pages for book {}: {}", bookId, e.getMessage());
        }

        bookRepository.save(book);

        log.info("Book {} — PDF stored at {} ({} bytes)", bookId, key, file.getSize());
        return key;
    }

    /** True when the book has a downloadable file attached. */
    @Transactional(readOnly = true)
    public boolean hasPdf(Long bookId) {
        return bookRepository.findById(bookId)
                .map(b -> b.getPdfS3Key() != null && !b.getPdfS3Key().isBlank())
                .orElse(false);
    }

    /**
     * Customer download. Defers to {@link BookAccessService} so free, purchased,
     * admin-granted and admin access all behave identically here.
     */
    @Transactional(readOnly = true)
    public byte[] downloadPdf(String email, Long bookId) throws IOException {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        if (!bookAccessService.hasAccess(email, bookId)) {
            throw new UnauthorizedException("You need to purchase this book before downloading it.");
        }

        if (book.getPdfS3Key() == null || book.getPdfS3Key().isBlank()) {
            throw new ResourceNotFoundException("No PDF has been uploaded for this book yet.");
        }
        Path file = Paths.get(uploadDir).resolve(book.getPdfS3Key());
        if (!Files.exists(file)) {
            throw new ResourceNotFoundException("The PDF file is missing on the server.");
        }
        return Files.readAllBytes(file);
    }

    @Transactional(readOnly = true)
    public String fileNameFor(Long bookId) {
        return bookRepository.findById(bookId).map(b -> b.getSlug() + ".pdf").orElse("book.pdf");
    }
}
