package com.kidscolour.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * One rendered / uploaded colouring page belonging to a book.
 * Produced either by the PDF pipeline or by an admin image upload.
 */
@Entity
@Table(name = "book_pages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    /** Storage key on disk (relative to the upload dir), not a public URL. */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "thumbnail_url", nullable = false, length = 500)
    private String thumbnailUrl;

    private Integer width;
    private Integer height;

    @Column(name = "is_preview")
    private Boolean isPreview;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
