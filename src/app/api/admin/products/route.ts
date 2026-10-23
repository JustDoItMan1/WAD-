import { handle, json, readBody } from '@/lib/http';
import { addProduct } from '@/lib/data/admin';
import { requireAdmin } from '@/lib/session';

export const POST = handle(async (request) => {
  await requireAdmin();
  return json({ productId: addProduct(await readBody(request)) }, 201);
});
