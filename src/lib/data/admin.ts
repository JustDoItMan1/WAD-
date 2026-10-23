import 'server-only';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { all, get, run } from '@/lib/db';
import { DEFAULT_IMAGE } from '@/constants';
import {
  ValidationError, EMAIL_PATTERN, optionalText, requireId, requireMatch, requireNumber, requireText,
} from '@/lib/validate';
import type { ContactMessage, ProductSales, ShopStats } from '@/types';

const IMAGE_DIR = join(process.cwd(), 'public', 'images', 'menu');

export const getStats = () => ({
  stats: get<ShopStats>(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing')) AS open_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
      (SELECT COUNT(*) FROM products WHERE stock_quantity < 10) AS low_stock,
      (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread_messages
  `)!,
  topProducts: all<ProductSales>('SELECT * FROM v_product_sales ORDER BY revenue DESC, units_sold DESC LIMIT 5'),
});

// Pictures an admin can choose for a menu item (read from the images folder)
export const listImages = () => readdirSync(IMAGE_DIR)
  .filter((file) => file.endsWith('.svg'))
  .map((file) => `/images/menu/${file}`);

const readImage = (value: unknown) => {
  const image = String(value || DEFAULT_IMAGE);
  if (!listImages().includes(image)) throw new ValidationError('Choose a picture from the list.');
  return image;
};

// Data entry: validates the admin form and returns the values in column order
const readProduct = (body: Record<string, unknown>) => [
  requireId(body.categoryId),
  requireText(body.name, 'Product name', 100),
  optionalText(body.description, 1000),
  requireNumber(body.price, 'Price', { min: 0.5, max: 10000 }),
  requireNumber(body.stock, 'Stock quantity', { min: 0, max: 10000, integer: true }),
  readImage(body.image),
  body.isAvailable ? 1 : 0,
] as const;

export const addProduct = (body: Record<string, unknown>) => Number(run(`
  INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, is_available)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`, ...readProduct(body)).lastInsertRowid);

export const updateProduct = (id: number, body: Record<string, unknown>) => run(`
  UPDATE products
  SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, is_available = ?
  WHERE product_id = ?
`, ...readProduct(body), id).changes > 0;

export const deleteProduct = (id: number) => {
  if (get('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1', id)) {
    throw new ValidationError('This item appears in past orders. Hide it from the menu instead of deleting it.');
  }
  return run('DELETE FROM products WHERE product_id = ?', id).changes > 0;
};

export const getMessages = () => all<ContactMessage>('SELECT * FROM contact_messages ORDER BY created_at DESC, message_id DESC');

export const saveMessage = (body: Record<string, unknown>) => run(
  'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
  requireText(body.name, 'Name', 100),
  requireMatch(body.email, EMAIL_PATTERN, 'Enter a valid email address.'),
  requireText(body.subject, 'Subject', 150),
  requireText(body.message, 'Message', 2000),
);

export const markMessage = (id: number, isRead: boolean) =>
  run('UPDATE contact_messages SET is_read = ? WHERE message_id = ?', isRead ? 1 : 0, id);

export const deleteMessage = (id: number) => run('DELETE FROM contact_messages WHERE message_id = ?', id);
