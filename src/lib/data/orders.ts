import 'server-only';
import { all, get, run, transaction } from '@/lib/db';
import {
  ValidationError, TIME_PATTERN, optionalText, requireId, requireMatch, requireNumber,
} from '@/lib/validate';
import { OPENING_TIME, CLOSING_TIME } from '@/constants';
import type { Order, OrderItem, OrderStatus, Product } from '@/types';

type OrderRow = Omit<Order, 'items'>;

const getOrderItems = (orderId: number) => all<OrderItem>(`
  SELECT oi.product_id, oi.quantity, oi.unit_price, p.name, p.image_url
  FROM order_items oi JOIN products p ON p.product_id = oi.product_id
  WHERE oi.order_id = ?
`, orderId);

const withItems = (orders: OrderRow[]): Order[] =>
  orders.map((order) => ({ ...order, items: getOrderItems(order.order_id) }));

export const getUserOrders = (userId: number) => withItems(all<OrderRow>(
  'SELECT * FROM v_order_summary WHERE user_id = ? ORDER BY created_at DESC, order_id DESC', userId
));

export const getAllOrders = (status: OrderStatus | null) => withItems(all<OrderRow>(`
  SELECT * FROM v_order_summary
  WHERE (? IS NULL OR status = ?)
  ORDER BY created_at DESC, order_id DESC
`, status, status));

interface OrderInput {
  pickupTime?: unknown;
  payment?: unknown;
  notes?: unknown;
  items?: unknown;
}

// Checks every line against the database: the browser's prices and stock are never trusted
const readLines = (items: unknown) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) throw new ValidationError('Your order is empty.');
  return list.map(({ productId, quantity }) => {
    const product = get<Product>('SELECT * FROM products WHERE product_id = ?', requireId(productId));
    const qty = requireNumber(quantity, 'Quantity', { min: 1, max: 20, integer: true });
    if (!product || !product.is_available) throw new ValidationError('An item in your order is no longer available.');
    if (product.stock_quantity < qty) {
      throw new ValidationError(`Only ${product.stock_quantity} × ${product.name} left in stock.`);
    }
    return { product, qty };
  });
};

// Saves the order, its items and the stock change in one transaction
export const placeOrder = (userId: number, input: OrderInput) => {
  const pickupTime = requireMatch(input.pickupTime, TIME_PATTERN, 'Choose a valid collection time.');
  if (pickupTime < OPENING_TIME || pickupTime > CLOSING_TIME) {
    throw new ValidationError(`Collection time must be between ${OPENING_TIME} and ${CLOSING_TIME}.`);
  }
  const payment = input.payment === 'card' ? 'card' : 'cash';
  const notes = optionalText(input.notes, 255);
  const lines = readLines(input.items);
  const total = lines.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

  const orderId = transaction(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO orders (user_id, pickup_time, payment_method, notes, total_amount) VALUES (?, ?, ?, ?, ?)',
      userId, pickupTime, payment, notes, total
    );
    for (const { product, qty } of lines) {
      run('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        lastInsertRowid, product.product_id, qty, product.price);
      run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?', qty, product.product_id);
    }
    return Number(lastInsertRowid);
  });
  return { orderId, total };
};

// Customers may cancel their own order while it is still pending; the stock is returned
export const cancelOrder = (userId: number, orderId: number) => {
  const order = get<OrderRow>('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', orderId, userId);
  if (!order) return false;
  if (order.status !== 'pending') throw new ValidationError('Only pending orders can be cancelled.');
  transaction(() => {
    run("UPDATE orders SET status = 'cancelled' WHERE order_id = ?", orderId);
    run(`
      UPDATE products SET stock_quantity = stock_quantity +
        (SELECT quantity FROM order_items WHERE order_id = ? AND product_id = products.product_id)
      WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = ?)
    `, orderId, orderId);
  });
  return true;
};

export const setOrderStatus = (orderId: number, status: OrderStatus) =>
  run('UPDATE orders SET status = ? WHERE order_id = ?', status, orderId).changes > 0;
