import { handle, json, readBody } from '@/lib/http';
import { getUserOrders, placeOrder } from '@/lib/data/orders';
import { requireUser } from '@/lib/session';

export const GET = handle(async () => {
  const user = await requireUser();
  return json({ orders: getUserOrders(user.id) });
});

export const POST = handle(async (request) => {
  const user = await requireUser();
  return json(placeOrder(user.id, await readBody(request)), 201);
});
