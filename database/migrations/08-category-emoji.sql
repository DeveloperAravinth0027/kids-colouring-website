-- ============================================================
-- Let admins pick an emoji icon for each category.
-- ============================================================

ALTER TABLE categories ADD COLUMN emoji VARCHAR(16) DEFAULT NULL AFTER color_hex;
