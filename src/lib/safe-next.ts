// Only allow redirects to pages on this site (prevents open-redirect attacks)
export const safeNext = (next: unknown, fallback: string) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;

export const withNext = (href: string, next: string | null) =>
  next ? `${href}?next=${encodeURIComponent(next)}` : href;
