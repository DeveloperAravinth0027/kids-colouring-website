-- ============================================================
-- Admin-granted free access to a book for a specific customer
-- ("gift this book to this user")
-- ============================================================

CREATE TABLE IF NOT EXISTS book_grants (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    book_id     BIGINT NOT NULL,
    granted_by  VARCHAR(150),              -- admin email, for the audit trail
    note        VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_grant_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uq_grant_user_book (user_id, book_id),
    INDEX idx_grant_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
