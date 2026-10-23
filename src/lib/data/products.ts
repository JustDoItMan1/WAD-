import 'server-only';
import { all, get } from '@/lib/db';
import type { Category, MenuFilters, MenuItem, Product } from '@/types';

const SORTS: Record<string, string> = {
  menu: 'p.category_id ASC, p.product_id ASC',
  name: 'p.name ASC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  newest: 'p.created_at DESC, p.product_id DESC',
};

export const getCategories = () => all<Category>(`
  SELECT c.*, COUNT(p.product_id) AS product_count
  FROM categories c LEFT JOIN products p ON p.category_id = c.category_id
  GROUP BY c.category_id ORDER BY c.category_id
`);

// Data listing + search: matches the name, description or section name
export const searchProducts = ({ q = '', category = '', sort = 'menu', available = false }: Partial<MenuFilters> = {}) => {
  const search = `%${q.trim()}%`;
  const categoryId = Number(category) || null;
  const orderBy = SORTS[sort] ?? SORTS.menu;
  return all<Product>(`
    SELECT p.*, c.name AS category
    FROM products p JOIN categories c ON c.category_id = p.category_id
    WHERE (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
      AND (? IS NULL OR p.category_id = ?)
      AND (? = 0 OR (p.is_available = 1 AND p.stock_quantity > 0))
    ORDER BY ${orderBy}
  `, search, search, search, categoryId, categoryId, available ? 1 : 0);
};

export const getProduct = (id: number) => get<Product>(`
  SELECT p.*, c.name AS category
  FROM products p JOIN categories c ON c.category_id = p.category_id
  WHERE p.product_id = ?
`, id);

export const getRelated = (product: Product) => all<MenuItem>(`
  SELECT product_id, name, description, price, stock_quantity, image_url, is_available FROM products
  WHERE category_id = ? AND product_id <> ? AND is_available = 1
  ORDER BY product_id LIMIT 4
`, product.category_id, product.product_id);

export const readFilters = (params: Record<string, string | string[] | undefined>): MenuFilters => {
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? '';
  };
  return {
    q: value('q'),
    category: value('category'),
    sort: value('sort') || 'menu',
    available: value('available') === '1',
  };
};
