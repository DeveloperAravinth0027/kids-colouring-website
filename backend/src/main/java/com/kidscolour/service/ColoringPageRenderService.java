package com.kidscolour.service;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiFunction;

/**
 * Converts an uploaded colouring-book PDF into web-ready page images.
 *
 * Pipeline (runs async when an admin uploads a PDF):
 *   PDF bytes
 *     -> Apache PDFBox {@link PDFRenderer} renders each page at RENDER_DPI
 *     -> full-resolution PNG (the online colouring "outline" layer)
 *     -> down-scaled thumbnail PNG (sidebar / book grid)
 *     -> both uploaded via the supplied storage function (S3 / Cloudinary)
 *     -> {@link RenderedPage} metadata persisted to the book_pages table
 *
 * The storage step is injected as a function so this class stays free of any
 * cloud SDK and is trivially unit-testable.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ColoringPageRenderService {

    /** 150 DPI is the sweet spot: crisp line art, reasonable file size. */
    public static final float RENDER_DPI = 150f;
    public static final int THUMB_WIDTH = 300;
    public static final int PREVIEW_LIMIT_FREE = 3; // preview pages for locked books

    @Data
    @Builder
    public static class RenderedPage {
        private int pageNumber;
        private String imageUrl;      // full-resolution page
        private String thumbnailUrl;  // sidebar thumbnail
        private int width;
        private int height;
        private long imageBytes;
    }

    /**
     * @param bookId  owning book id (used only to namespace storage keys)
     * @param pdf     raw PDF bytes
     * @param store   (storageKey, pngBytes) -> public/signed URL
     * @return one {@link RenderedPage} per PDF page, in order
     */
    public List<RenderedPage> process(Long bookId, byte[] pdf,
                                      BiFunction<String, byte[], String> store) throws IOException {
        List<RenderedPage> pages = new ArrayList<>();

        try (PDDocument document = Loader.loadPDF(pdf)) {
            int count = document.getNumberOfPages();
            log.info("Rendering {} page(s) for book {}", count, bookId);
            PDFRenderer renderer = new PDFRenderer(document);
            // Anti-aliased rendering for smooth outlines the flood-fill can respect.
            renderer.setSubsamplingAllowed(true);

            for (int i = 0; i < count; i++) {
                BufferedImage full = renderer.renderImageWithDPI(i, RENDER_DPI, ImageType.RGB);

                byte[] fullPng = toPng(full);
                byte[] thumbPng = toPng(scaleToWidth(full, THUMB_WIDTH));

                String base = "books/" + bookId + "/pages/" + (i + 1);
                String imageUrl = store.apply(base + ".png", fullPng);
                String thumbUrl = store.apply(base + "-thumb.png", thumbPng);

                pages.add(RenderedPage.builder()
                        .pageNumber(i + 1)
                        .imageUrl(imageUrl)
                        .thumbnailUrl(thumbUrl)
                        .width(full.getWidth())
                        .height(full.getHeight())
                        .imageBytes(fullPng.length)
                        .build());

                full.flush();
                log.debug("Book {} page {}/{} -> {}", bookId, i + 1, count, imageUrl);
            }
        }
        return pages;
    }

    /** High-quality down-scale preserving aspect ratio. */
    private BufferedImage scaleToWidth(BufferedImage src, int targetWidth) {
        if (src.getWidth() <= targetWidth) return src;
        int targetHeight = Math.round((float) src.getHeight() * targetWidth / src.getWidth());
        BufferedImage out = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, targetWidth, targetHeight, null);
        g.dispose();
        return out;
    }

    private byte[] toPng(BufferedImage image) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        }
    }

    /** Quick page count without rendering (used for validation / progress UI). */
    public int pageCount(byte[] pdf) throws IOException {
        try (PDDocument doc = Loader.loadPDF(new ByteArrayInputStream(pdf).readAllBytes())) {
            return doc.getNumberOfPages();
        }
    }
}
