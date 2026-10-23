import { handle, json, readBody } from '@/lib/http';
import { setOrderStatus } from '@/lib/data/orders';
import { requireAdmin } from '@/lib/session';
import { ValidationError, requireId } from '@/lib/validate';
import { ORDER_STATUSES } from '@/constants';
import type { OrderStatus } from '@/types';

export const PATCH = handle<{ id: string }>(async (request, { id }) => {
  await requireAdmin();
  const status = (await readBody(request)).status as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new ValidationError('Invalid order status.');
  if (!setOrderStatus(requireId(id), status)) return json({ error: 'Order not found.' }, 404);
  return json({ ok: true });
});
