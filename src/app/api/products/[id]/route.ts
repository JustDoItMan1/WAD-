import { handle, json } from '@/lib/http';
import { getProduct, getRelated } from '@/lib/data/products';
import { requireId } from '@/lib/validate';

export const GET = handle<{ id: string }>((request, { id }) => {
  const product = getProduct(requireId(id));
  if (!product) return json({ error: 'Product not found.' }, 404);
  return json({ product, related: getRelated(product) });
});
