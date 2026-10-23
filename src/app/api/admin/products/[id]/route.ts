import { handle, json, readBody } from '@/lib/http';
import { deleteProduct, updateProduct } from '@/lib/data/admin';
import { requireAdmin } from '@/lib/session';
import { requireId } from '@/lib/validate';

export const PUT = handle<{ id: string }>(async (request, { id }) => {
  await requireAdmin();
  if (!updateProduct(requireId(id), await readBody(request))) return json({ error: 'Product not found.' }, 404);
  return json({ ok: true });
});

export const DELETE = handle<{ id: string }>(async (request, { id }) => {
  await requireAdmin();
  if (!deleteProduct(requireId(id))) return json({ error: 'Product not found.' }, 404);
  return json({ ok: true });
});
