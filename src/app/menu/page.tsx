import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/features/menu/MenuBrowser';
import { getCategories, readFilters, searchProducts } from '@/lib/data/products';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Prices for rolls, slap chips, snacks, sweets and cold drinks at the Tuck In tuckshop.',
};

interface MenuPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MenuPage = async ({ searchParams }: MenuPageProps) => {
  const filters = readFilters(await searchParams);
  const names = [...new Set(searchProducts().map((product) => product.name))];
  return (
    <main id="main">
      <header className="container page-header">
        <h1>Menu</h1>
        <p>Sold-out items come back after the next delivery.</p>
      </header>
      <section className="container" aria-labelledby="results-title">
        <h2 id="results-title" className="visually-hidden">Menu items</h2>
        <MenuBrowser
          categories={getCategories()}
          names={names}
          initialFilters={filters}
          initialProducts={searchProducts(filters)}
        />
      </section>
    </main>
  );
};

export default MenuPage;
