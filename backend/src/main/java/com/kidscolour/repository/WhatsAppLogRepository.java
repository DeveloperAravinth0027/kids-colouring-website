package com.kidscolour.repository;

import com.kidscolour.model.WhatsAppLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WhatsAppLogRepository extends JpaRepository<WhatsAppLog, Long> {
}
