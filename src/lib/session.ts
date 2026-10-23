import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, run } from '@/lib/db';
import { HttpError } from '@/lib/http';
import { hashToken, newToken } from '@/lib/security';
import type { SessionUser } from '@/types';

const COOKIE = 'tuckin_session';
const LIFETIME_HOURS = 8;

interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: SessionUser['role'];
}

const toSessionUser = ({ user_id, full_name, email, phone, role }: UserRow): SessionUser => ({
  id: user_id, name: full_name, email, phone, role,
});

// Starts a session: a random token goes in an HTTP-only cookie, its hash goes in the sessions table
export const startSession = async (userId: number) => {
  const token = newToken();
  const expires = new Date(Date.now() + LIFETIME_HOURS * 60 * 60 * 1000);
  run(
    "INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, datetime(?, 'unixepoch'))",
    hashToken(token), userId, Math.floor(expires.getTime() / 1000)
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
};

export const endSession = async () => {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) run('DELETE FROM sessions WHERE session_id = ?', hashToken(token));
  store.delete(COOKIE);
};

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = get<UserRow>(`
    SELECT u.user_id, u.full_name, u.email, u.phone, u.role
    FROM sessions s JOIN users u ON u.user_id = s.user_id
    WHERE s.session_id = ? AND s.expires_at > CURRENT_TIMESTAMP
  `, hashToken(token));
  return row ? toSessionUser(row) : null;
};

// API guards: throw an error the route handler turns into 401 / 403
export const requireUser = async () => {
  const user = await getSessionUser();
  if (!user) throw new HttpError('Please log in to continue.', 401);
  return user;
};

export const requireAdmin = async () => {
  const user = await requireUser();
  if (user.role !== 'admin') throw new HttpError('Administrator access required.', 403);
  return user;
};

// Page guards: redirect instead, so the browser lands on the login page
export const userOrRedirect = async (page: string) => {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${page}`);
  return user;
};

export const adminOrRedirect = async () => {
  const user = await userOrRedirect('/admin');
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
};
