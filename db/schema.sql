-- =============================================================
-- Tuck In Tuckshop - Database schema (table creation script)
-- Dialect: SQLite (standard SQL; see README for MySQL notes)
-- Concepts: primary/foreign keys, constraints (NOT NULL, UNIQUE,
-- CHECK, DEFAULT), cascading rules, indexes, views and triggers.
-- =============================================================

PRAGMA foreign_keys = ON;

DROP VIEW IF EXISTS v_order_summary;
DROP VIEW IF EXISTS v_product_sales;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- Registered customers and administrators
CREATE TABLE users (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10)  NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'admin')),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product groupings shown as filters on the menu
CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Items sold by the tuckshop
CREATE TABLE products (
    product_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id    INTEGER      NOT NULL,
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    price          DECIMAL(8,2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER      NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url      VARCHAR(255) NOT NULL DEFAULT '/images/menu/default.svg',
    is_available   INTEGER      NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- One row per order placed by a customer
CREATE TABLE orders (
    order_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER      NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'preparing', 'ready', 'collected', 'cancelled')),
    pickup_time   VARCHAR(5)   NOT NULL,
    payment_method VARCHAR(10) NOT NULL DEFAULT 'cash'
                  CHECK (payment_method IN ('cash', 'card')),
    notes         VARCHAR(255),
    total_amount  DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Line items (many-to-many link between orders and products)
CREATE TABLE order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER      NOT NULL,
    product_id    INTEGER      NOT NULL,
    quantity      INTEGER      NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    unit_price    DECIMAL(8,2) NOT NULL CHECK (unit_price > 0),
    FOREIGN KEY (order_id)   REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE RESTRICT,
    UNIQUE (order_id, product_id)
);

-- Messages submitted through the contact page
CREATE TABLE contact_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    subject    VARCHAR(150) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    INTEGER      NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Login sessions: the browser cookie holds a random token, the database stores only its SHA-256 hash
CREATE TABLE sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    expires_at DATETIME    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes to speed up searching and joins
CREATE INDEX idx_products_name     ON products (name);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_orders_user       ON orders (user_id);
CREATE INDEX idx_orders_status     ON orders (status);
CREATE INDEX idx_items_order       ON order_items (order_id);
CREATE INDEX idx_sessions_user     ON sessions (user_id);

-- Trigger: automatically mark a product unavailable when stock runs out
CREATE TRIGGER trg_products_out_of_stock
AFTER UPDATE OF stock_quantity ON products
WHEN NEW.stock_quantity = 0
BEGIN
    UPDATE products SET is_available = 0 WHERE product_id = NEW.product_id;
END;

-- View: orders joined with the customer and item count
CREATE VIEW v_order_summary AS
SELECT o.order_id,
       o.user_id,
       u.full_name AS customer_name,
       u.email     AS customer_email,
       o.status,
       o.pickup_time,
       o.payment_method,
       o.notes,
       o.total_amount,
       o.created_at,
       COALESCE(SUM(oi.quantity), 0) AS item_count
FROM orders o
JOIN users u            ON u.user_id = o.user_id
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id;

-- View: units sold and revenue per product (used in admin reports)
CREATE VIEW v_product_sales AS
SELECT p.product_id,
       p.name,
       c.name AS category,
       COALESCE(SUM(oi.quantity), 0)                 AS units_sold,
       COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
FROM products p
JOIN categories c ON c.category_id = p.category_id
LEFT JOIN (
    SELECT oi.product_id, oi.quantity, oi.unit_price
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.status <> 'cancelled'
) oi ON oi.product_id = p.product_id
GROUP BY p.product_id;
