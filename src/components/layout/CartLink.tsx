'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

export const CartLink = () => {
  const { count } = useCart();
  const pathname = usePathname();
  return (
    <Link className="order-link" href="/cart" aria-current={pathname === '/cart' ? 'page' : undefined}>
      Your order{' '}
      {/* A new key remounts the badge, replaying its "bump" animation whenever the count changes */}
      <span key={count} className={count ? 'cart-count bump' : 'cart-count'}>{count}</span>
    </Link>
  );
};
