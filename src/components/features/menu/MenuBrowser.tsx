'use client';
import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MenuRow } from '@/components/features/menu/MenuRow';
import { MenuFiltersForm } from '@/components/features/menu/MenuFiltersForm';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api-client';
import { plural } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import type { Category, MenuFilters, Product } from '@/types';

interface MenuBrowserProps {
  categories: Category[];
  names: string[];
  initialFilters: MenuFilters;
  initialProducts: Product[];
}

const toQuery = ({ q, category, sort, available }: MenuFilters) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  if (sort !== 'menu') params.set('sort', sort);
  if (available) params.set('available', '1');
  return params.toString();
};

// Data listing page: the price list grouped by section, with live search, section filter and sorting.
// The first page of results is rendered on the server; later searches are fetched by TanStack Query.
export const MenuBrowser = ({ categories, names, initialFilters, initialProducts }: MenuBrowserProps) => {
  const [filters, setFilters] = useState(initialFilters);
  const debouncedQ = useDebounce(filters.q.trim(), 300);
  const active = { ...filters, q: debouncedQ };
  const query = toQuery(active);

  const { data, error, isFetching } = useQuery({
    queryKey: queryKeys.products(active),
    queryFn: () => api.get<{ products: Product[] }>(`/products?${query}`).then((result) => result.products),
    initialData: query === toQuery(initialFilters) ? initialProducts : undefined,
    placeholderData: keepPreviousData,
  });

  // Keep the filters in the URL so results can be shared and survive a reload
  useEffect(() => {
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, [query]);

  const products = data ?? [];
  const groups = categories
    .map((category) => ({ category, items: products.filter((p) => p.category_id === category.category_id) }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <MenuFiltersForm filters={filters} categories={categories} names={names} onChange={setFilters} />
      <p className="result-count" aria-live="polite">
        {plural(products.length, 'item')}{active.q && ` matching “${active.q}”`}
      </p>
      <div className="menu-columns" aria-busy={isFetching}>
        {error && <p className="alert alert--error">{error.message}</p>}
        {!error && data && products.length === 0 && (
          <p className="empty-state">Nothing on the menu matches “{active.q}”. Try “russian”, “chips” or “Coke”.</p>
        )}
        {groups.map(({ category, items }) => (
          <section key={category.category_id} className="price-group" aria-labelledby={`group-${category.category_id}`}>
            <h2 id={`group-${category.category_id}`}>{category.name}</h2>
            <ul role="list">
              {items.map((product) => <MenuRow key={product.product_id} product={product} term={active.q} />)}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
};
