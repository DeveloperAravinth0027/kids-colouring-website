-- ============================================================
-- Kids Colouring Book E-commerce Platform
-- MySQL 8.0+ Database Schema
-- Author: Senior Full Stack Architect
-- Version: 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS kids_colour_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE kids_colour_db;

-- ============================================================
-- TABLE: users
-- Stores both customers and admin accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password        VARCHAR(255),                          -- NULL for Google OAuth users
    phone           VARCHAR(20),
    role            ENUM('CUSTOMER','ADMIN')               NOT NULL DEFAULT 'CUSTOMER',
    provider        ENUM('LOCAL','GOOGLE')                 NOT NULL DEFAULT 'LOCAL',
    provider_id     VARCHAR(255),                          -- Google OAuth sub
    avatar_url      VARCHAR(500),
    is_active       BOOLEAN                                NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN                                NOT NULL DEFAULT FALSE,
    verify_token    VARCHAR(255),
    reset_token     VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at      DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME                               NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: categories
-- Book categories (Animals, Vehicles, Princess, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    slug            VARCHAR(120)    NOT NULL UNIQUE,
    description     TEXT,
    icon_url        VARCHAR(500),
    cover_image_url VARCHAR(500),
    color_hex       VARCHAR(10)     DEFAULT '#FF6B6B',
    sort_order      INT             NOT NULL DEFAULT 0,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: books
-- Core book catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    category_id         BIGINT          NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    slug                VARCHAR(300)    NOT NULL UNIQUE,
    description         TEXT            NOT NULL,
    short_description   VARCHAR(500),
    age_group           VARCHAR(50)     NOT NULL,          -- e.g. "3-5", "6-8", "9-12"
    num_pages           INT             NOT NULL DEFAULT 0,
    language            VARCHAR(50)     NOT NULL DEFAULT 'English',
    cover_image_url     VARCHAR(500),                      -- Cloudinary URL
    pdf_s3_key          VARCHAR(500),                      -- S3 object key (never exposed directly)
    pdf_size_mb         DECIMAL(6,2),
    preview_pdf_url     VARCHAR(500),                      -- Public preview PDF (first 5 pages)
    price               DECIMAL(10,2)   NOT NULL,
    discount_percent    INT             NOT NULL DEFAULT 0,
    final_price         DECIMAL(10,2)   NOT NULL,          -- Computed: price - discount
    amazon_kdp_link     VARCHAR(1000),                     -- Physical book link
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_free             BOOLEAN         NOT NULL DEFAULT FALSE,
    total_downloads     INT             NOT NULL DEFAULT 0,
    total_sales         INT             NOT NULL DEFAULT 0,
    average_rating      DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
    review_count        INT             NOT NULL DEFAULT 0,
    seo_title           VARCHAR(255),
    seo_description     VARCHAR(500),
    seo_keywords        VARCHAR(500),
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_books_slug (slug),
    INDEX idx_books_category (category_id),
    INDEX idx_books_featured (is_featured),
    INDEX idx_books_active (is_active),
    INDEX idx_books_price (final_price),
    FULLTEXT INDEX ft_books_search (name, description, seo_keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: book_preview_images
-- Multiple preview images per book
-- ============================================================
CREATE TABLE IF NOT EXISTS book_preview_images (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    book_id     BIGINT          NOT NULL,
    image_url   VARCHAR(500)    NOT NULL,
    caption     VARCHAR(255),
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_preview_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: book_tags
-- Searchable tags per book
-- ============================================================
CREATE TABLE IF NOT EXISTS book_tags (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    book_id     BIGINT          NOT NULL,
    tag         VARCHAR(100)    NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_tags_book (book_id),
    INDEX idx_tags_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: coupons
-- Discount coupon codes
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    code                VARCHAR(50)     NOT NULL UNIQUE,
    description         VARCHAR(255),
    discount_type       ENUM('PERCENT','FLAT')  NOT NULL DEFAULT 'PERCENT',
    discount_value      DECIMAL(10,2)   NOT NULL,
    min_order_amount    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    max_discount_amount DECIMAL(10,2),                     -- Cap for percentage discounts
    max_uses            INT,                               -- NULL = unlimited
    used_count          INT             NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    valid_from          DATETIME        NOT NULL,
    valid_until         DATETIME,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- Customer orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    order_number    VARCHAR(50)     NOT NULL UNIQUE,       -- e.g. KCB-2024-000001
    status          ENUM('PENDING','PAID','FAILED','REFUNDED','CANCELLED')
                                    NOT NULL DEFAULT 'PENDING',
    subtotal        DECIMAL(10,2)   NOT NULL,
    discount_amount DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(10,2)   NOT NULL,
    coupon_id       BIGINT,
    coupon_code     VARCHAR(50),
    currency        VARCHAR(10)     NOT NULL DEFAULT 'INR',
    billing_name    VARCHAR(150),
    billing_email   VARCHAR(150),
    billing_phone   VARCHAR(20),
    invoice_url     VARCHAR(500),
    email_sent      BOOLEAN         NOT NULL DEFAULT FALSE,
    whatsapp_sent   BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: order_items
-- Line items for each order
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    order_id        BIGINT          NOT NULL,
    book_id         BIGINT          NOT NULL,
    book_name       VARCHAR(255)    NOT NULL,              -- Snapshot at time of purchase
    book_cover_url  VARCHAR(500),
    unit_price      DECIMAL(10,2)   NOT NULL,
    quantity        INT             NOT NULL DEFAULT 1,
    total_price     DECIMAL(10,2)   NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payments
-- Payment gateway records
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    order_id                BIGINT          NOT NULL UNIQUE,
    gateway                 ENUM('RAZORPAY','STRIPE')      NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id        VARCHAR(255),                  -- Razorpay order ID / Stripe PaymentIntent ID
    gateway_payment_id      VARCHAR(255),                  -- Razorpay payment ID / Stripe charge ID
    gateway_signature       VARCHAR(500),                  -- HMAC signature for verification
    amount                  DECIMAL(10,2)   NOT NULL,
    currency                VARCHAR(10)     NOT NULL DEFAULT 'INR',
    status                  ENUM('CREATED','AUTHORIZED','CAPTURED','FAILED','REFUNDED')
                                            NOT NULL DEFAULT 'CREATED',
    payment_method          VARCHAR(50),                   -- card, upi, netbanking etc.
    failure_reason          VARCHAR(500),
    refund_id               VARCHAR(255),
    refunded_at             DATETIME,
    paid_at                 DATETIME,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_gateway_order (gateway_order_id),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: downloads
-- Secure download tokens (UUID, 24h TTL)
-- ============================================================
CREATE TABLE IF NOT EXISTS downloads (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    order_item_id   BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    book_id         BIGINT          NOT NULL,
    token           VARCHAR(255)    NOT NULL UNIQUE,       -- UUID v4
    download_count  INT             NOT NULL DEFAULT 0,
    max_downloads   INT             NOT NULL DEFAULT 5,
    expires_at      DATETIME        NOT NULL,
    last_downloaded DATETIME,
    ip_address      VARCHAR(50),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_downloads_token (token),
    INDEX idx_downloads_user (user_id),
    INDEX idx_downloads_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reviews
-- Book ratings and reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    book_id     BIGINT          NOT NULL,
    user_id     BIGINT          NOT NULL,
    order_id    BIGINT,                                    -- Verified purchase link
    rating      TINYINT         NOT NULL,                  -- 1-5
    title       VARCHAR(255),
    body        TEXT,
    is_approved BOOLEAN         NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE KEY uk_review_user_book (user_id, book_id),
    INDEX idx_reviews_book (book_id),
    INDEX idx_reviews_approved (is_approved),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: wishlists
-- Customer wishlists
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     BIGINT      NOT NULL,
    book_id     BIGINT      NOT NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_wishlist_user_book (user_id, book_id),
    INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: email_logs
-- Audit log of all sent emails
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT,
    order_id    BIGINT,
    to_email    VARCHAR(150)    NOT NULL,
    subject     VARCHAR(255)    NOT NULL,
    template    VARCHAR(100),
    status      ENUM('SENT','FAILED','PENDING')    NOT NULL DEFAULT 'PENDING',
    error_msg   VARCHAR(1000),
    sent_at     DATETIME,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email_logs_user (user_id),
    INDEX idx_email_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: whatsapp_logs
-- Audit log of WhatsApp messages
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT,
    order_id        BIGINT,
    phone_number    VARCHAR(20)     NOT NULL,
    template_name   VARCHAR(100),
    message_id      VARCHAR(255),                          -- Meta API message ID
    status          ENUM('SENT','FAILED','DELIVERED','READ','PENDING')
                                    NOT NULL DEFAULT 'PENDING',
    error_msg       VARCHAR(1000),
    sent_at         DATETIME,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_wa_logs_user (user_id),
    INDEX idx_wa_logs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORED PROCEDURE: Generate Order Number
-- ============================================================
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS generate_order_number(OUT out_number VARCHAR(50))
BEGIN
    DECLARE next_id BIGINT;
    SELECT AUTO_INCREMENT INTO next_id
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders';
    SET out_number = CONCAT('KCB-', YEAR(NOW()), '-', LPAD(IFNULL(next_id, 1), 6, '0'));
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER: Auto-update book average_rating and review_count
-- ============================================================
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    IF NEW.is_approved = TRUE THEN
        UPDATE books
        SET average_rating = (
            SELECT AVG(rating) FROM reviews
            WHERE book_id = NEW.book_id AND is_approved = TRUE
        ),
        review_count = (
            SELECT COUNT(*) FROM reviews
            WHERE book_id = NEW.book_id AND is_approved = TRUE
        )
        WHERE id = NEW.book_id;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS trg_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE books
    SET average_rating = (
        SELECT COALESCE(AVG(rating), 0) FROM reviews
        WHERE book_id = NEW.book_id AND is_approved = TRUE
    ),
    review_count = (
        SELECT COUNT(*) FROM reviews
        WHERE book_id = NEW.book_id AND is_approved = TRUE
    )
    WHERE id = NEW.book_id;
END$$
DELIMITER ;

-- ============================================================
-- VIEW: v_book_summary
-- Convenient view for book listings
-- ============================================================
CREATE OR REPLACE VIEW v_book_summary AS
SELECT
    b.id,
    b.name,
    b.slug,
    b.short_description,
    b.age_group,
    b.cover_image_url,
    b.price,
    b.discount_percent,
    b.final_price,
    b.is_featured,
    b.is_free,
    b.average_rating,
    b.review_count,
    b.total_sales,
    b.amazon_kdp_link,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug
FROM books b
JOIN categories c ON b.category_id = c.id
WHERE b.is_active = TRUE AND c.is_active = TRUE;

-- ============================================================
-- VIEW: v_order_summary
-- ============================================================
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.currency,
    o.created_at,
    u.id AS user_id,
    u.name AS customer_name,
    u.email AS customer_email,
    p.gateway,
    p.gateway_payment_id,
    p.status AS payment_status
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN payments p ON p.order_id = o.id;
