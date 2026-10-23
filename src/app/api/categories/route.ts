import { handle, json } from '@/lib/http';
import { getCategories } from '@/lib/data/products';

export const GET = handle(() => json({ categories: getCategories() }));
