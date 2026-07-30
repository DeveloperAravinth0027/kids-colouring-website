-- ============================================================
-- Which product line(s) a category belongs to.
-- Existing categories hold both story and colouring books today,
-- so they default to BOTH — nothing is orphaned.
-- ============================================================

ALTER TABLE categories
    ADD COLUMN book_type ENUM('COLOURING','STORY','BOTH') NOT NULL DEFAULT 'BOTH' AFTER slug;

CREATE INDEX idx_categories_type ON categories(book_type);
