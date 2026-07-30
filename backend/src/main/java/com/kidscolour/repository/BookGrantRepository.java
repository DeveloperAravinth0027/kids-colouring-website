package com.kidscolour.repository;

import com.kidscolour.model.BookGrant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookGrantRepository extends JpaRepository<BookGrant, Long> {
    boolean existsByUser_IdAndBook_Id(Long userId, Long bookId);
    List<BookGrant> findByUser_IdOrderByCreatedAtDesc(Long userId);
    List<BookGrant> findAllByOrderByCreatedAtDesc();
    void deleteByUser_IdAndBook_Id(Long userId, Long bookId);
}
