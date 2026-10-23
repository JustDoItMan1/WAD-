// Tuck In server: serves the HTML pages in public/ and a JSON API backed by the SQLite database.
// Uses only modules built into Node.js (22.13 or newer), so there is nothing to install.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const DB_DIR = join(ROOT, 'db');
const DB_FILE = join(DB_DIR, 'tuckshop.db');
const PORT = Number(process.env.PORT) || 4000;

const COOKIE = 'tuckin_session';
const SESSION_HOURS = 8;
const OPENING_TIME = '07:30';
const CLOSING_TIME = '15:30';
const MAX_QUANTITY = 20;
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];

// ---------- Passwords and session tokens ----------

// Passwords are stored as "salt:hash" using the scrypt key-derivation function
const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
};

// The browser cookie holds a random token; the database stores only its SHA-256 hash
const newToken = () => randomBytes(32).toString('hex');
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// ---------- Database ----------

const runScript = (db, file) => db.exec(readFileSync(join(DB_DIR, file), 'utf8'));

const seedUsers = (db) => {
  const insert = db.prepare('INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)');
  insert.run('Shop Administrator', 'admin@tuckin.com', '0811234567', hashPassword('Admin@123'), 'admin');
  const { lastInsertRowid: customerId } = insert.run(
    'Demo Student', 'student@tuckin.com', '0817654321', hashPassword('Student@123'), 'customer'
  );

  // A couple of historic orders so the dashboards have data to show
  const order = db.prepare('INSERT INTO orders (user_id, status, pickup_time, notes, total_amount) VALUES (?, ?, ?, ?, ?)');
  const item = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');
  const priceOf = db.prepare('SELECT product_id, price FROM products WHERE name = ?');
  const addItem = (orderId, name, quantity) => {
    const { product_id, price } = priceOf.get(name);
    item.run(orderId, product_id, quantity, price);
  };

  const first = order.run(customerId, 'collected', '10:30', 'No onions please', 51.0).lastInsertRowid;
  addItem(first, 'Boerewors roll', 1);
  addItem(first, 'Coca-Cola 500ml', 1);

  const second = order.run(customerId, 'pending', '13:00', null, 84.0).lastInsertRowid;
  addItem(second, 'Cheese russian roll', 1);
  addItem(second, 'Chip roll', 1);
  addItem(second, 'Reboost 500ml', 1);
  addItem(second, 'Popcorn', 1);
  addItem(second, 'Chappies bubblegum', 6);
};

// Opens db/tuckshop.db, building it from schema.sql and seed.sql the first time
const openDatabase = () => {
  const isNew = !existsSync(DB_FILE);
  const db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA foreign_keys = ON;');
  if (isNew) {
    runScript(db, 'schema.sql');
    runScript(db, 'seed.sql');
    seedUsers(db);
    console.log('Database created and seeded at', DB_FILE);
  }
  return db;
};

const db = openDatabase();

// node:sqlite rows have no prototype; spreading them gives plain objects
const all = (sql, ...params) => db.prepare(sql).all(...params).map((row) => ({ ...row }));
const get = (sql, ...params) => {
  const row = db.prepare(sql).get(...params);
  return row ? { ...row } : undefined;
};
const run = (sql, ...params) => db.prepare(sql).run(...params);

// Runs a function inside a transaction, rolling back if anything throws
const transaction = (work) => {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};

// ---------- Validation (never trust the browser's validation alone) ----------

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const invalid = (message) => new HttpError(400, message);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9 ]{7,15}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const requireText = (value, label, max = 255) => {
  const text = String(value ?? '').trim();
  if (!text) throw invalid(`${label} is required.`);
  if (text.length > max) throw invalid(`${label} must be ${max} characters or fewer.`);
  return text;
};

const optionalText = (value, max = 255) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

const requireMatch = (value, pattern, message) => {
  const text = String(value ?? '').trim();
  if (!pattern.test(text)) throw invalid(message);
  return text;
};

const requireNumber = (value, label, { min = 0, max = Infinity, integer = false } = {}) => {
  const number = Number(value);
  const valid = Number.isFinite(number) && number >= min && number <= max;
  if (!valid || (integer && !Number.isInteger(number))) {
    throw invalid(`${label} must be a ${integer ? 'whole ' : ''}number between ${min} and ${max}.`);
  }
  return number;
};

const requireId = (value) => requireNumber(value, 'ID', { min: 1, integer: true });

const optionalPhone = (value) => {
  const phone = optionalText(value, 20);
  if (phone && !PHONE_PATTERN.test(phone)) throw invalid('Enter a valid phone number.');
  return phone;
};

// ---------- Sessions ----------

const readCookie = (req, name) =>
  (req.headers.cookie ?? '').split(';').map((part) => part.trim().split('='))
    .find(([key]) => key === name)?.[1];

const sessionCookie = (token, maxAge) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

const toSessionUser = ({ user_id, full_name, email, phone, role }) => ({ id: user_id, name: full_name, email, phone, role });

const startSession = (res, userId) => {
  const token = newToken();
  run(
    `INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_HOURS} hours'))`,
    hashToken(token), userId
  );
  res.setHeader('Set-Cookie', sessionCookie(token, SESSION_HOURS * 3600));
};

const endSession = (req, res) => {
  const token = readCookie(req, COOKIE);
  if (token) run('DELETE FROM sessions WHERE session_id = ?', hashToken(token));
  res.setHeader('Set-Cookie', sessionCookie('', 0));
};

const getSessionUser = (req) => {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const user = get(
    `SELECT u.* FROM sessions s JOIN users u ON u.user_id = s.user_id
     WHERE s.session_id = ? AND s.expires_at > datetime('now')`,
    hashToken(token)
  );
  return user ? toSessionUser(user) : null;
};

const requireUser = (req) => {
  const user = getSessionUser(req);
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  return user;
};

const requireAdmin = (req) => {
  const user = requireUser(req);
  if (user.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  return user;
};

// ---------- Products and categories ----------

const SORTS = {
  menu: 'p.category_id ASC, p.product_id ASC',
  name: 'p.name ASC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  newest: 'p.created_at DESC, p.product_id DESC',
};

const getCategories = () => all(`
  SELECT c.*, COUNT(p.product_id) AS product_count
  FROM categories c LEFT JOIN products p ON p.category_id = c.category_id
  GROUP BY c.category_id ORDER BY c.name
`);

// Data listing + search: ?q=russian&category=1&sort=price-asc&available=1
const searchProducts = (query) => {
  const search = `%${String(query.get('q') ?? '').trim()}%`;
  const category = query.get('category') ? Number(query.get('category')) : null;
  const onlyAvailable = query.get('available') === '1' ? 1 : 0;
  const orderBy = SORTS[query.get('sort')] ?? SORTS.menu;
  return all(`
    SELECT p.*, c.name AS category
    FROM products p JOIN categories c ON c.category_id = p.category_id
    WHERE (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
      AND (? IS NULL OR p.category_id = ?)
      AND (? = 0 OR (p.is_available = 1 AND p.stock_quantity > 0))
    ORDER BY ${orderBy}
  `, search, search, search, category, category, onlyAvailable);
};

const getProduct = (id) => {
  const product = get(`
    SELECT p.*, c.name AS category
    FROM products p JOIN categories c ON c.category_id = p.category_id
    WHERE p.product_id = ?
  `, id);
  if (!product) throw new HttpError(404, 'Product not found.');
  const related = all(`
    SELECT product_id, name, description, price, stock_quantity, image_url, is_available FROM products
    WHERE category_id = ? AND product_id <> ? AND is_available = 1
    ORDER BY product_id LIMIT 4
  `, product.category_id, id);
  return { product, related };
};

// Pictures an admin can choose for a menu item (read from the images folder)
const listImages = () => readdirSync(join(PUBLIC_DIR, 'images', 'menu'))
  .filter((file) => file.endsWith('.svg'))
  .map((file) => `/images/menu/${file}`);

const readImage = (value) => {
  const image = String(value ?? '/images/menu/default.svg');
  if (!listImages().includes(image)) throw invalid('Choose a picture from the list.');
  return image;
};

const readProduct = (body) => [
  requireId(body.categoryId),
  requireText(body.name, 'Product name', 100),
  optionalText(body.description, 1000),
  requireNumber(body.price, 'Price', { min: 0.5, max: 10000 }),
  requireNumber(body.stock, 'Stock quantity', { min: 0, max: 10000, integer: true }),
  readImage(body.image),
  body.isAvailable ? 1 : 0,
];

// ---------- Orders ----------

const withItems = (order) => ({
  ...order,
  items: all(`
    SELECT oi.product_id, oi.quantity, oi.unit_price, p.name, p.image_url
    FROM order_items oi JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
  `, order.order_id),
});

// Validates stock and saves the order, its items and the stock change atomically
const placeOrder = (userId, body) => {
  const pickupTime = requireMatch(body.pickupTime, TIME_PATTERN, 'Choose a valid pickup time.');
  if (pickupTime < OPENING_TIME || pickupTime > CLOSING_TIME) {
    throw invalid(`Pickup time must be between ${OPENING_TIME} and ${CLOSING_TIME}.`);
  }
  const payment = body.payment === 'card' ? 'card' : 'cash';
  const notes = optionalText(body.notes, 255);
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) throw invalid('Your cart is empty.');

  const lines = items.map(({ productId, quantity }) => {
    const product = get('SELECT * FROM products WHERE product_id = ?', requireId(productId));
    const qty = requireNumber(quantity, 'Quantity', { min: 1, max: MAX_QUANTITY, integer: true });
    if (!product || !product.is_available) throw invalid('An item in your cart is no longer available.');
    if (product.stock_quantity < qty) throw invalid(`Only ${product.stock_quantity} × ${product.name} left in stock.`);
    return { product, qty };
  });
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

// Customers may cancel their own order while it is still pending; stock is returned
const cancelOrder = (userId, id) => {
  const order = get('SELECT * FROM orders WHERE order_id = ? AND user_id = ?', id, userId);
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.status !== 'pending') throw invalid('Only pending orders can be cancelled.');
  transaction(() => {
    run("UPDATE orders SET status = 'cancelled' WHERE order_id = ?", id);
    run(`
      UPDATE products SET stock_quantity = stock_quantity +
        (SELECT quantity FROM order_items WHERE order_id = ? AND product_id = products.product_id)
      WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = ?)
    `, id, id);
  });
};

// ---------- API routes ----------
// Each route is "METHOD /path" with :id standing for a number in the URL

const routes = {
  'POST /api/auth/register': ({ body, res }) => {
    const name = requireText(body.name, 'Full name', 100);
    const email = requireMatch(body.email, EMAIL_PATTERN, 'Enter a valid email address.').toLowerCase();
    const phone = optionalPhone(body.phone);
    const password = requireMatch(body.password, PASSWORD_PATTERN,
      'Password needs 8+ characters with upper case, lower case and a number.');
    if (password !== body.confirmPassword) throw invalid('Passwords do not match.');
    if (get('SELECT 1 FROM users WHERE email = ?', email)) {
      throw new HttpError(409, 'An account with that email already exists.');
    }
    const { lastInsertRowid } = run(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      name, email, phone, hashPassword(password)
    );
    startSession(res, lastInsertRowid);
    return [201, { user: toSessionUser(get('SELECT * FROM users WHERE user_id = ?', lastInsertRowid)) }];
  },

  'POST /api/auth/login': ({ body, res }) => {
    const email = String(body.email ?? '').trim().toLowerCase();
    const user = get('SELECT * FROM users WHERE email = ?', email);
    if (!user || !verifyPassword(String(body.password ?? ''), user.password_hash)) {
      throw new HttpError(401, 'Incorrect email or password.');
    }
    startSession(res, user.user_id);
    return { user: toSessionUser(user) };
  },

  'POST /api/auth/logout': ({ req, res }) => {
    endSession(req, res);
    return { ok: true };
  },

  'GET /api/auth/me': ({ req }) => ({ user: getSessionUser(req) }),

  'PUT /api/auth/me': ({ req, body }) => {
    const user = requireUser(req);
    const name = requireText(body.name, 'Full name', 100);
    const phone = optionalPhone(body.phone);
    run('UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', name, phone, user.id);
    return { user: { ...user, name, phone } };
  },

  'GET /api/categories': () => ({ categories: getCategories() }),

  'GET /api/products': ({ query }) => {
    const products = searchProducts(query);
    return { products, count: products.length };
  },

  'GET /api/products/:id': ({ id }) => getProduct(id),

  'GET /api/orders': ({ req }) => ({
    orders: all('SELECT * FROM v_order_summary WHERE user_id = ? ORDER BY created_at DESC, order_id DESC', requireUser(req).id)
      .map(withItems),
  }),

  'POST /api/orders': ({ req, body }) => [201, placeOrder(requireUser(req).id, body)],

  'PATCH /api/orders/:id/cancel': ({ req, id }) => {
    cancelOrder(requireUser(req).id, id);
    return { ok: true };
  },

  'POST /api/contact': ({ body }) => {
    run('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      requireText(body.name, 'Name', 100),
      requireMatch(body.email, EMAIL_PATTERN, 'Enter a valid email address.'),
      requireText(body.subject, 'Subject', 150),
      requireText(body.message, 'Message', 2000));
    return [201, { ok: true }];
  },

  'GET /api/admin/stats': ({ req }) => {
    requireAdmin(req);
    const stats = get(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing')) AS open_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
        (SELECT COUNT(*) FROM products WHERE stock_quantity < 10) AS low_stock,
        (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread_messages
    `);
    const topProducts = all('SELECT * FROM v_product_sales ORDER BY revenue DESC, units_sold DESC LIMIT 5');
    return { stats, topProducts };
  },

  'GET /api/admin/orders': ({ req, query }) => {
    requireAdmin(req);
    const status = ORDER_STATUSES.includes(query.get('status')) ? query.get('status') : null;
    return {
      orders: all('SELECT * FROM v_order_summary WHERE (? IS NULL OR status = ?) ORDER BY created_at DESC, order_id DESC',
        status, status).map(withItems),
    };
  },

  'PATCH /api/admin/orders/:id': ({ req, id, body }) => {
    requireAdmin(req);
    if (!ORDER_STATUSES.includes(body.status)) throw invalid('Invalid order status.');
    if (!run('UPDATE orders SET status = ? WHERE order_id = ?', body.status, id).changes) {
      throw new HttpError(404, 'Order not found.');
    }
    return { ok: true };
  },

  'POST /api/admin/products': ({ req, body }) => {
    requireAdmin(req);
    const { lastInsertRowid } = run(`
      INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ...readProduct(body));
    return [201, { productId: Number(lastInsertRowid) }];
  },

  'PUT /api/admin/products/:id': ({ req, id, body }) => {
    requireAdmin(req);
    const { changes } = run(`
      UPDATE products
      SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ?, image_url = ?, is_available = ?
      WHERE product_id = ?
    `, ...readProduct(body), id);
    if (!changes) throw new HttpError(404, 'Product not found.');
    return { ok: true };
  },

  'DELETE /api/admin/products/:id': ({ req, id }) => {
    requireAdmin(req);
    if (get('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1', id)) {
      throw invalid('This product appears in past orders. Mark it unavailable instead of deleting it.');
    }
    if (!run('DELETE FROM products WHERE product_id = ?', id).changes) throw new HttpError(404, 'Product not found.');
    return { ok: true };
  },

  'GET /api/admin/images': ({ req }) => {
    requireAdmin(req);
    return { images: listImages() };
  },

  'GET /api/admin/users': ({ req }) => {
    requireAdmin(req);
    return {
      users: all(`
        SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.created_at,
               COUNT(o.order_id) AS order_count,
               COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total_amount END), 0) AS total_spent
        FROM users u LEFT JOIN orders o ON o.user_id = u.user_id
        GROUP BY u.user_id ORDER BY u.created_at DESC
      `),
    };
  },

  'GET /api/admin/messages': ({ req }) => {
    requireAdmin(req);
    return { messages: all('SELECT * FROM contact_messages ORDER BY created_at DESC') };
  },

  'PATCH /api/admin/messages/:id': ({ req, id, body }) => {
    requireAdmin(req);
    run('UPDATE contact_messages SET is_read = ? WHERE message_id = ?', body.isRead ? 1 : 0, id);
    return { ok: true };
  },

  'DELETE /api/admin/messages/:id': ({ req, id }) => {
    requireAdmin(req);
    run('DELETE FROM contact_messages WHERE message_id = ?', id);
    return { ok: true };
  },
};

// Finds the route for a request, turning a number in the path into :id
const findRoute = (method, pathname) => {
  const match = pathname.match(/^(.*?\/)(\d+)(\/[a-z]+)?$/);
  if (match) {
    const handler = routes[`${method} ${match[1]}:id${match[3] ?? ''}`];
    if (handler) return { handler, id: requireId(match[2]) };
  }
  return { handler: routes[`${method} ${pathname}`] };
};

const sendJson = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const readBody = async (req) => {
  let text = '';
  for await (const chunk of req) text += chunk;
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw invalid('The request body is not valid JSON.');
  }
};

const handleApi = async (req, res, url) => {
  try {
    const { handler, id } = findRoute(req.method, url.pathname);
    if (!handler) return sendJson(res, 404, { error: 'Not found.' });
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
    const result = handler({ req, res, body, id, query: url.searchParams });
    const [status, data] = Array.isArray(result) ? result : [200, result];
    sendJson(res, status, data);
  } catch (error) {
    // Errors we raised carry a status; SQL constraint errors become 400s, everything else a 500
    if (error.status) return sendJson(res, error.status, { error: error.message });
    if (String(error.message).includes('constraint')) {
      return sendJson(res, 400, { error: `The data breaks a database rule: ${error.message}` });
    }
    console.error(error);
    sendJson(res, 500, { error: 'Something went wrong on the server.' });
  }
};

// ---------- Pages and files ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// "/menu" serves public/menu.html, "/" serves public/index.html
const resolveFile = (pathname) => {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = clean === '/' ? ['/index.html'] : [clean, `${clean}.html`];
  return candidates.map((path) => join(PUBLIC_DIR, path))
    .find((file) => file.startsWith(PUBLIC_DIR) && existsSync(file) && statSync(file).isFile());
};

const redirect = (res, location) => {
  res.writeHead(302, { Location: location });
  res.end();
};

// Page guard: sends visitors to the login page instead of showing pages they cannot use
const guardPage = (req, res, pathname) => {
  const page = pathname.replace(/\.html$/, '');
  if (page !== '/dashboard' && page !== '/admin') return false;
  const user = getSessionUser(req);
  if (!user) return redirect(res, `/login?next=${page}`), true;
  if (page === '/admin' && user.role !== 'admin') return redirect(res, '/dashboard'), true;
  return false;
};

const serveFile = (req, res, url) => {
  if (guardPage(req, res, url.pathname)) return;
  const file = resolveFile(url.pathname);
  if (!file) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(readFileSync(join(PUBLIC_DIR, '404.html')));
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
};

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  serveFile(req, res, url);
}).listen(PORT, () => console.log(`Tuck In is running at http://localhost:${PORT}`));
