import 'server-only';
import { all, get, run } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/security';
import { HttpError } from '@/lib/http';
import {
  ValidationError, EMAIL_PATTERN, PASSWORD_PATTERN, optionalPhone, requireMatch, requireText,
} from '@/lib/validate';
import type { Customer } from '@/types';

interface Credentials {
  user_id: number;
  password_hash: string;
  role: string;
}

export const createUser = (body: Record<string, unknown>) => {
  const name = requireText(body.name, 'Full name', 100);
  const email = requireMatch(body.email, EMAIL_PATTERN, 'Enter a valid email address.').toLowerCase();
  const phone = optionalPhone(body.phone);
  const password = requireMatch(
    body.password, PASSWORD_PATTERN,
    'Password needs 8+ characters with upper case, lower case and a number.'
  );
  if (password !== body.confirmPassword) throw new ValidationError('Passwords do not match.');
  if (get('SELECT 1 FROM users WHERE email = ?', email)) {
    throw new HttpError('An account with that email already exists.', 409);
  }
  const { lastInsertRowid } = run(
    'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    name, email, phone, hashPassword(password)
  );
  return Number(lastInsertRowid);
};

// Returns the user id when the email and password match, otherwise null
export const checkLogin = (email: unknown, password: unknown) => {
  const user = get<Credentials>(
    'SELECT user_id, password_hash, role FROM users WHERE email = ?',
    String(email ?? '').trim().toLowerCase()
  );
  if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) return null;
  return user;
};

export const updateProfile = (userId: number, body: Record<string, unknown>) => {
  const name = requireText(body.name, 'Full name', 100);
  const phone = optionalPhone(body.phone);
  run('UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?', name, phone, userId);
};

export const getCustomers = () => all<Customer>(`
  SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.created_at,
         COUNT(o.order_id) AS order_count,
         COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total_amount END), 0) AS total_spent
  FROM users u LEFT JOIN orders o ON o.user_id = u.user_id
  GROUP BY u.user_id ORDER BY u.created_at DESC
`);
