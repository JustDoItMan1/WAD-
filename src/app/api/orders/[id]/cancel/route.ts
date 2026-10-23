import { handle, json } from '@/lib/http';
import { cancelOrder } from '@/lib/data/orders';
import { requireUser } from '@/lib/session';
import { requireId } from '@/lib/validate';

export const PATCH = handle<{ id: string }>(async (request, { id }) => {
  const user = await requireUser();
  if (!cancelOrder(user.id, requireId(id))) return json({ error: 'Order not found.' }, 404);
  return json({ ok: true });
});
