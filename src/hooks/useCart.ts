'use client';
import { useSyncExternalStore } from 'react';
import { EMPTY_CART, cart } from '@/lib/cart-store';

// Subscribes a component to the cart; the server always renders an empty cart
export const useCart = () => {
  const items = useSyncExternalStore(cart.subscribe, () => cart.items, () => EMPTY_CART);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
  return { items, count, total, cart };
};
