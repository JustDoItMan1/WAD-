import { handle, json } from '@/lib/http';
import { getCustomers } from '@/lib/data/users';
import { requireAdmin } from '@/lib/session';

export const GET = handle(async () => {
  await requireAdmin();
  return json({ users: getCustomers() });
});
