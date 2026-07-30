-- ============================================================
-- Online Colouring System — schema additions
-- Apply after 01-schema.sql / 02-seed.sql
-- ============================================================

-- Rendered page images produced by the PDF pipeline (PDFBox).
CREATE TABLE IF NOT EXISTS book_pages (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id        BIGINT NOT NULL,
    page_number    INT NOT NULL,
    image_url      VARCHAR(500) NOT NULL,   -- full-resolution outline PNG (signed URL / key)
    thumbnail_url  VARCHAR(500) NOT NULL,
    width          INT,
    height         INT,
    is_preview     BOOLEAN NOT NULL DEFAULT FALSE,  -- viewable before purchase
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookpage_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uq_book_page (book_id, page_number),
    INDEX idx_bookpage_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tracks PDF processing state so the admin UI can show progress.
CREATE TABLE IF NOT EXISTS book_processing_jobs (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id       BIGINT NOT NULL,
    status        ENUM('PENDING','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
    total_pages   INT DEFAULT 0,
    done_pages    INT DEFAULT 0,
    error_message VARCHAR(500),
    started_at    TIMESTAMP NULL,
    finished_at   TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_job_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A customer's colouring of one page (the editable working copy).
CREATE TABLE IF NOT EXISTS drawing_sessions (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    book_id       BIGINT NOT NULL,
    page_id       BIGINT NOT NULL,
    artwork_url   VARCHAR(500),            -- latest paint-layer PNG (S3)
    is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_page FOREIGN KEY (page_id) REFERENCES book_pages(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_page (user_id, page_id),
    INDEX idx_session_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Named saved versions ("Save multiple versions").
CREATE TABLE IF NOT EXISTS saved_artwork (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id   BIGINT NOT NULL,
    title        VARCHAR(120),
    artwork_url  VARCHAR(500) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_session FOREIGN KEY (session_id) REFERENCES drawing_sessions(id) ON DELETE CASCADE,
    INDEX idx_saved_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookmarks / favourites / "continue where you left off".
CREATE TABLE IF NOT EXISTS bookmarks (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    book_id     BIGINT NOT NULL,
    last_page   INT DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmark_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uq_bookmark (user_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Online colouring usage metric shown in the admin dashboard.
-- (MySQL has no "ADD COLUMN IF NOT EXISTS"; run once.)
ALTER TABLE books ADD COLUMN online_coloring_count INT NOT NULL DEFAULT 0;
