-- ============================================================
-- Two product lines: Colouring Books and Story Books
-- ============================================================

ALTER TABLE books
    ADD COLUMN book_type ENUM('COLOURING','STORY') NOT NULL DEFAULT 'COLOURING' AFTER category_id;

CREATE INDEX idx_books_type ON books(book_type);
