import type { Metadata } from 'next';
import { CartItems } from '@/components/features/cart/CartItems';
import { Checkout } from '@/components/features/cart/Checkout';
import { getSessionUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Your order',
  description: 'Check your order, choose a collection time and send it to the tuckshop.',
};

const CartPage = async () => {
  const user = await getSessionUser();
  return (
    <main id="main">
      <header className="container page-header">
        <h1>Your order</h1>
      </header>
      <div className="container split split--wide-left">
        <section aria-labelledby="items-title">
          <h2 id="items-title" className="visually-hidden">Items</h2>
          <CartItems />
        </section>
        <Checkout loggedIn={Boolean(user)} />
      </div>
    </main>
  );
};

export default CartPage;
