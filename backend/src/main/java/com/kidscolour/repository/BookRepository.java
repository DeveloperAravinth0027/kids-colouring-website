package com.kidscolour.repository;

import com.kidscolour.model.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    /** Counts every book in a category, archived ones included. */
    long countByCategoryId(Long categoryId);
    long countByCategoryIdAndIsActiveTrue(Long categoryId);

    Optional<Book> findBySlug(String slug);
    Boolean existsBySlug(String slug);

    // Listing queries JOIN FETCH the category. Without it every row triggers a
    // separate lazy-load query (the classic N+1): one 20-book page cost 15 round
    // trips instead of 2. countQuery is supplied because a fetch join can't be
    // counted directly.
    @Query(value = "SELECT b FROM Book b JOIN FETCH b.category WHERE b.isActive = true",
           countQuery = "SELECT COUNT(b) FROM Book b WHERE b.isActive = true")
    Page<Book> findByIsActiveTrue(Pageable pageable);

    @Query(value = "SELECT b FROM Book b JOIN FETCH b.category WHERE b.isFeatured = true AND b.isActive = true",
           countQuery = "SELECT COUNT(b) FROM Book b WHERE b.isFeatured = true AND b.isActive = true")
    Page<Book> findByIsFeaturedTrueAndIsActiveTrue(Pageable pageable);

    @Query(value = "SELECT b FROM Book b JOIN FETCH b.category WHERE b.isFree = true AND b.isActive = true",
           countQuery = "SELECT COUNT(b) FROM Book b WHERE b.isFree = true AND b.isActive = true")
    Page<Book> findByIsFreeTrueAndIsActiveTrue(Pageable pageable);

    @Query(value = "SELECT b FROM Book b JOIN FETCH b.category WHERE b.category.id = :categoryId AND b.isActive = true",
           countQuery = "SELECT COUNT(b) FROM Book b WHERE b.category.id = :categoryId AND b.isActive = true")
    Page<Book> findByCategoryIdAndIsActiveTrue(@Param("categoryId") Long categoryId, Pageable pageable);

    /** Detail page: fetch the category in the same round trip. */
    @Query("SELECT b FROM Book b JOIN FETCH b.category WHERE b.slug = :slug")
    Optional<Book> findBySlugWithCategory(@Param("slug") String slug);

    @Query(value = "SELECT * FROM books b WHERE b.is_active = true AND " +
            "MATCH(b.name, b.description, b.seo_keywords) AGAINST(:searchTerm IN BOOLEAN MODE)", 
            nativeQuery = true)
    Page<Book> searchBooks(@Param("searchTerm") String searchTerm, Pageable pageable);
}
