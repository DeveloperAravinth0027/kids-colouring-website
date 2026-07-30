package com.kidscolour.repository;

import com.kidscolour.model.BookPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookPageRepository extends JpaRepository<BookPage, Long> {
    List<BookPage> findByBookIdOrderByPageNumberAsc(Long bookId);
    long countByBookId(Long bookId);
}
