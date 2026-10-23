import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Money } from '@/components/ui';
import { MenuRow } from '@/components/features/menu/MenuRow';
import { AddToOrder } from '@/components/features/menu/AddToOrder';
import { getProduct, getRelated } from '@/lib/data/products';
import { isSoldOut } from '@/lib/format';
import type { Product } from '@/types';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

const findProduct = async (params: ProductPageProps['params']) => {
  const id = Number((await params).id);
  const product = Number.isInteger(id) && id > 0 ? getProduct(id) : undefined;
  if (!product) notFound();
  return product;
};

export const generateMetadata = async ({ params }: ProductPageProps): Promise<Metadata> => {
  const product = await findProduct(params);
  return { title: product.name, description: product.description ?? undefined };
};

const stockText = (product: Product) => {
  if (isSoldOut(product)) return 'Sold out until the next delivery';
  if (product.stock_quantity < 10) return `Only ${product.stock_quantity} left today`;
  return 'In stock';
};

// Details page: one menu item on its own board, then more from the same section
const ProductPage = async ({ params }: ProductPageProps) => {
  const product = await findProduct(params);
  const related = getRelated(product);
  return (
    <main id="main">
      <div className="container section">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/menu">Menu</Link></li>
            <li><Link href={`/menu?category=${product.category_id}`}>{product.category}</Link></li>
          </ol>
        </nav>

        <article>
          <header className="product-board">
            {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG */}
            <img className="product-board__img" src={product.image_url} alt={product.name} width={180} height={180} />
            <div>
              <h1>{product.name}</h1>
              <p>{product.description}</p>
            </div>
            <Money className="product-board__price" amount={product.price} />
          </header>
          <dl className="product-facts">
            <dt>Section</dt><dd><Link href={`/menu?category=${product.category_id}`}>{product.category}</Link></dd>
            <dt>Availability</dt><dd>{stockText(product)}</dd>
          </dl>
          {isSoldOut(product)
            ? <p><span className="sticker">Sold out</span></p>
            : <AddToOrder product={product} />}
        </article>
      </div>

      {related.length > 0 && (
        <section className="container" aria-labelledby="related-title">
          <h2 id="related-title">More {product.category.toLowerCase()}</h2>
          <ul className="price-list" role="list">
            {related.map((item) => <MenuRow key={item.product_id} product={item} />)}
          </ul>
        </section>
      )}
    </main>
  );
};

export default ProductPage;
