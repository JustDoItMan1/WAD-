import { handle, json } from '@/lib/http';
import { getStats } from '@/lib/data/admin';
import { requireAdmin } from '@/lib/session';

export const GET = handle(async () => {
  await requireAdmin();
  return json(getStats());
});
