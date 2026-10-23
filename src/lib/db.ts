import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { hashPassword } from '@/lib/security';

const DB_DIR = join(process.cwd(), 'db');
const DB_FILE = join(DB_DIR, 'tuckshop.db');

const runScript = (db: DatabaseSync, file: string) => db.exec(readFileSync(join(DB_DIR, file), 'utf8'));

// Demo accounts and a couple of historic orders so the dashboards have data to show
const seedUsers = (db: DatabaseSync) => {
  const insert = db.prepare(
    'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  );
  insert.run('Shop Administrator', 'admin@tuckin.com', '0811234567', hashPassword('Admin@123'), 'admin');
  const customerId = insert.run(
    'Demo Student', 'student@tuckin.com', '0817654321', hashPassword('Student@123'), 'customer'
  ).lastInsertRowid;

  const order = db.prepare(
    'INSERT INTO orders (user_id, status, pickup_time, notes, total_amount) VALUES (?, ?, ?, ?, ?)'
  );
  const item = db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
  );
  const priceOf = db.prepare('SELECT product_id, price FROM products WHERE name = ?');
  const addItem = (orderId: number | bigint, name: string, quantity: number) => {
    const { product_id, price } = priceOf.get(name) as { product_id: number; price: number };
    item.run(orderId, product_id, quantity, price);
  };

  const first = order.run(customerId, 'collected', '10:30', 'No onions please', 51).lastInsertRowid;
  addItem(first, 'Boerewors roll', 1);
  addItem(first, 'Coca-Cola 500ml', 1);
  const second = order.run(customerId, 'pending', '13:00', null, 84).lastInsertRowid;
  addItem(second, 'Cheese russian roll', 1);
  addItem(second, 'Chip roll', 1);
  addItem(second, 'Reboost 500ml', 1);
  addItem(second, 'Popcorn', 1);
  addItem(second, 'Chappies bubblegum', 6);
};

// Opens the database file, creating and seeding it from the SQL scripts on first run
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

// Reuse one connection across hot reloads in development
const globalForDb = globalThis as unknown as { tuckshopDb?: DatabaseSync };
export const db = (globalForDb.tuckshopDb ??= openDatabase());

type Params = SQLInputValue[];

// node:sqlite returns rows without a prototype; copying them makes plain objects React can send to the browser
export const all = <T>(sql: string, ...params: Params) => db.prepare(sql).all(...params).map((row) => ({ ...row }) as T);

export const get = <T>(sql: string, ...params: Params) => {
  const row = db.prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
};
export const run = (sql: string, ...params: Params) => db.prepare(sql).run(...params);

// Runs a function inside a transaction, rolling back if anything throws
export const transaction = <T>(work: () => T): T => {
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
