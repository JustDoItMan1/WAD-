'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AddButton } from '@/components/features/menu/AddButton';
import { MAX_QUANTITY } from '@/constants';
import type { Product } from '@/types';

interface AddToOrderProps {
  product: Product;
}

// Quantity stepper and "Add to order" button on the details page
export const AddToOrder = ({ product }: AddToOrderProps) => {
  const maxQty = Math.max(1, Math.min(product.stock_quantity, MAX_QUANTITY));
  const [quantity, setQuantity] = useState(1);
  const clamp = (value: number) => Math.max(1, Math.min(maxQty, Math.round(value) || 1));

  return (
    <form className="purchase" onSubmit={(event) => event.preventDefault()}>
      <div className="qty">
        <button type="button" aria-label="One less" onClick={() => setQuantity(clamp(quantity - 1))}>−</button>
        <label className="visually-hidden" htmlFor="quantity">Quantity</label>
        <input type="number" id="quantity" min={1} max={maxQty} value={quantity}
          onChange={(event) => setQuantity(clamp(Number(event.target.value)))} />
        <button type="button" aria-label="One more" onClick={() => setQuantity(clamp(quantity + 1))}>+</button>
      </div>
      <AddButton product={product} quantity={quantity} className="btn btn--sign">
        {quantity === 1 ? 'Add to order' : `Add ${quantity} to order`}
      </AddButton>
      <Link className="btn btn--outline" href="/cart">View your order</Link>
    </form>
  );
};
