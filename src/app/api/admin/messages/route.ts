import { handle, json } from '@/lib/http';
import { getMessages } from '@/lib/data/admin';
import { requireAdmin } from '@/lib/session';

export const GET = handle(async () => {
  await requireAdmin();
  return json({ messages: getMessages() });
});
