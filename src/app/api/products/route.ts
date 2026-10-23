import { handle, json } from '@/lib/http';
import { readFilters, searchProducts } from '@/lib/data/products';

// Data listing + search: /api/products?q=russian&category=1&sort=price-asc&available=1
export const GET = handle((request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const products = searchProducts(readFilters(params));
  return json({ products, count: products.length });
});
