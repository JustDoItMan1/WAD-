'use client';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatMoney } from '@/lib/format';
import { DEFAULT_IMAGE } from '@/constants';

export const CartItems = () => {
  const { items, cart } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>Nothing added yet.</p>
        <p><Link className="btn" href="/menu">Go to the menu</Link></p>
      </div>
    );
  }

  return (
    <ul role="list">
      {items.map(({ productId, name, price, image, quantity }) => (
        <li key={productId} className="slip-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG */}
          <img className="slip-row__img" src={image ?? DEFAULT_IMAGE} alt="" width={56} height={56} />
          <div>
            <h3><Link href={`/menu/${productId}`}>{name}</Link></h3>
            <p className="field-hint">{formatMoney(price)} each</p>
          </div>
          <p className="slip-row__total">{formatMoney(price * quantity)}</p>
          <div className="slip-row__controls">
            <div className="qty">
              <button type="button" aria-label={`One less ${name}`} onClick={() => cart.update(productId, quantity - 1)}>−</button>
              <label className="visually-hidden" htmlFor={`qty-${productId}`}>Quantity of {name}</label>
              <input type="number" id={`qty-${productId}`} value={quantity} min={1} max={20}
                onChange={(event) => cart.update(productId, Math.round(Number(event.target.value)))} />
              <button type="button" aria-label={`One more ${name}`} onClick={() => cart.update(productId, quantity + 1)}>+</button>
            </div>
            <button className="btn btn--sm btn--outline" type="button" onClick={() => cart.remove(productId)}>Remove</button>
          </div>
        </li>
      ))}
    </ul>
  );
};
