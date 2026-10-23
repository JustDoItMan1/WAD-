import Link from 'next/link';
import { Money } from '@/components/ui';
import { OpenStatus } from '@/components/features/home/OpenStatus';
import { searchProducts } from '@/lib/data/products';
import { getSessionUser } from '@/lib/session';
import { COLD_DRINKS_CATEGORY, ROLLS_CATEGORY } from '@/constants';

// The board shows the hot rolls plus a few cold drinks, like the wall at the counter
const getBoardItems = () => {
  const available = searchProducts({ available: true });
  return [
    ...available.filter((p) => p.category_id === ROLLS_CATEGORY).slice(0, 6),
    ...available.filter((p) => p.category_id === COLD_DRINKS_CATEGORY).slice(0, 3),
  ];
};

const HomePage = async () => {
  const user = await getSessionUser();
  return (
    <main id="main">
      <section className="board" aria-labelledby="board-title">
        <div className="container board__inner">
          <div className="board__intro">
            <h1 id="board-title">Order from class. Collect at the counter.</h1>
            <p>Choose what you want, pick a collection time, and your food is ready when you get to Block C. Pay cash or card when you collect.</p>
            <div className="button-row">
              <Link className="btn btn--sign" href="/menu">See the full menu</Link>
              {!user && <Link className="btn btn--outline" href="/register">Create an account</Link>}
            </div>
            <OpenStatus />
          </div>

          <div>
            <h2 className="visually-hidden">Today&apos;s prices</h2>
            <ul className="board__list" role="list">
              {getBoardItems().map((product) => (
                <li key={product.product_id}>
                  <Link href={`/menu/${product.product_id}`}>{product.name}</Link>
                  <span className="leader" aria-hidden="true" />
                  <Money amount={product.price} />
                </li>
              ))}
            </ul>
            <p className="board__more"><Link href="/menu">Snacks, sweets and hot drinks on the full menu</Link></p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title">How ordering works</h2>
          <ol className="steps" role="list">
            <li>
              <h3>Choose your food</h3>
              <p>Add rolls, snacks and drinks to your order and pick a time to collect between 07:30 and 15:30.</p>
            </li>
            <li>
              <h3>We start making it</h3>
              <p>Your order shows as preparing on your account page, then ready when it is packed.</p>
            </li>
            <li>
              <h3>Pay and collect</h3>
              <p>Give your order number at the Block C counter and pay with cash or card.</p>
            </li>
          </ol>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
