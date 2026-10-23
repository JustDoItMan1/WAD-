import { handle, json } from '@/lib/http';
import { getAllOrders } from '@/lib/data/orders';
import { requireAdmin } from '@/lib/session';
import { ORDER_STATUSES } from '@/constants';
import type { OrderStatus } from '@/types';

export const GET = handle(async (request) => {
  await requireAdmin();
  const wanted = new URL(request.url).searchParams.get('status') as OrderStatus;
  const status = ORDER_STATUSES.includes(wanted) ? wanted : null;
  return json({ orders: getAllOrders(status) });
});
