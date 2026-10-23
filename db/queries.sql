-- =============================================================
-- Tuck In Tuckshop - Reference queries used by the application
-- (CRUD, joins, aggregates, sub-queries). Parameters are shown
-- as ? placeholders exactly as the server uses them, which
-- prevents SQL injection.
-- =============================================================

-- READ: menu listing with search, category filter and sorting
SELECT p.*, c.name AS category
FROM products p
JOIN categories c ON c.category_id = p.category_id
WHERE (p.name LIKE ? OR p.description LIKE ?)
  AND (? IS NULL OR p.category_id = ?)
ORDER BY p.name ASC;

-- READ: single product details page
SELECT p.*, c.name AS category
FROM products p JOIN categories c ON c.category_id = p.category_id
WHERE p.product_id = ?;

-- CREATE: register a user
INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?);

-- CREATE: place an order (runs inside a transaction with its items)
INSERT INTO orders (user_id, pickup_time, payment_method, notes, total_amount) VALUES (?, ?, ?, ?, ?);
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?);
UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?;

-- UPDATE: admin changes an order status
UPDATE orders SET status = ? WHERE order_id = ?;

-- UPDATE: admin edits a product
UPDATE products
SET category_id = ?, name = ?, description = ?, price = ?,
    stock_quantity = ?, image_url = ?, is_available = ?
WHERE product_id = ?;

-- DELETE: admin removes a product that has never been ordered
DELETE FROM products
WHERE product_id = ?
  AND product_id NOT IN (SELECT DISTINCT product_id FROM order_items);

-- AGGREGATE: admin dashboard statistics
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'customer')                       AS customers,
    (SELECT COUNT(*) FROM orders)                                              AS orders,
    (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing'))     AS open_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
    (SELECT COUNT(*) FROM products WHERE stock_quantity < 10)                  AS low_stock,
    (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0)                  AS unread_messages;

-- AGGREGATE + VIEW: best-selling products
SELECT * FROM v_product_sales ORDER BY revenue DESC, units_sold DESC LIMIT 5;

-- GROUP BY / HAVING: customers who have spent more than N$100
SELECT u.full_name, COUNT(o.order_id) AS orders, SUM(o.total_amount) AS spent
FROM users u
JOIN orders o ON o.user_id = u.user_id
WHERE o.status <> 'cancelled'
GROUP BY u.user_id
HAVING SUM(o.total_amount) > 100
ORDER BY spent DESC;
