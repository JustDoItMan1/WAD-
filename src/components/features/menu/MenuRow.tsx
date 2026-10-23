import Link from 'next/link';
import { Highlight, Money } from '@/components/ui';
import { AddButton } from '@/components/features/menu/AddButton';
import { isSoldOut } from '@/lib/format';
import type { MenuItem } from '@/types';

interface MenuRowProps {
  product: MenuItem;
  term?: string;
}

// One line of the price list: picture, name ...... price, description, and an Add button
export const MenuRow = ({ product, term }: MenuRowProps) => {
  const soldOut = isSoldOut(product);
  return (
    <li className={soldOut ? 'menu-row menu-row--sold-out' : 'menu-row'}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small local SVGs need no optimising */}
      <img className="menu-row__img" src={product.image_url} alt="" width={64} height={64} loading="lazy" />
      <div className="menu-row__line">
        <h3 className="menu-row__name">
          <Link href={`/menu/${product.product_id}`}><Highlight text={product.name} term={term} /></Link>
        </h3>
        <span className="leader" aria-hidden="true" />
        <Money className="menu-row__price" amount={product.price} />
      </div>
      <p className="menu-row__desc"><Highlight text={product.description ?? ''} term={term} /></p>
      <div className="menu-row__action">
        {soldOut ? <span className="sticker">Sold out</span> : <AddButton product={product} />}
      </div>
    </li>
  );
};
