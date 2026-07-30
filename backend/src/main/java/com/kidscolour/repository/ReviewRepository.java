package com.kidscolour.repository;

import com.kidscolour.model.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByBookIdAndIsApprovedTrue(Long bookId, Pageable pageable);
    Optional<Review> findByUserIdAndBookId(Long userId, Long bookId);
    List<Review> findByIsApprovedFalse();
}
