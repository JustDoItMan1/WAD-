'use client';
import { SORT_OPTIONS } from '@/constants';
import type { Category, MenuFilters } from '@/types';

interface MenuFiltersFormProps {
  filters: MenuFilters;
  categories: Category[];
  names: string[];
  onChange: (filters: MenuFilters) => void;
}

export const MenuFiltersForm = ({ filters, categories, names, onChange }: MenuFiltersFormProps) => {
  const set = (change: Partial<MenuFilters>) => onChange({ ...filters, ...change });
  const chips = [{ category_id: '', name: 'Everything' }, ...categories];

  return (
    <form className="toolbar" role="search" aria-label="Filter the menu" onSubmit={(event) => event.preventDefault()}>
      <div className="field">
        <label htmlFor="q">Search</label>
        <input type="search" id="q" name="q" list="product-names" placeholder="Russian, Fanta, chips…"
          autoComplete="off" value={filters.q} onChange={(event) => set({ q: event.target.value })} />
        <datalist id="product-names">
          {names.map((name) => <option key={name} value={name} />)}
        </datalist>
      </div>
      <div className="field">
        <label htmlFor="sort">Sort</label>
        <select id="sort" name="sort" value={filters.sort} onChange={(event) => set({ sort: event.target.value })}>
          {SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <label className="checkbox">
        <input type="checkbox" id="available" name="available" checked={filters.available}
          onChange={(event) => set({ available: event.target.checked })} /> Hide sold-out items
      </label>
      <div className="category-chips" role="group" aria-label="Show one section">
        {chips.map(({ category_id, name }) => (
          <button key={name} type="button" className="chip" aria-pressed={String(category_id) === filters.category}
            onClick={() => set({ category: String(category_id) })}>
            {name}
          </button>
        ))}
      </div>
    </form>
  );
};
