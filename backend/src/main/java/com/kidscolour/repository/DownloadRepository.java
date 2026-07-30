package com.kidscolour.repository;

import com.kidscolour.model.Download;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DownloadRepository extends JpaRepository<Download, Long> {
    Optional<Download> findByToken(String token);
    List<Download> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Download> findByOrderItemId(Long orderItemId);
}
