import Link from 'next/link';

const NotFound = () => (
  <main id="main">
    <section className="container not-found">
      <h1>This page doesn&apos;t exist</h1>
      <p>The link may be old or mistyped, or the item was taken off the menu.</p>
      <div className="button-row">
        <Link className="btn" href="/menu">Go to the menu</Link>
        <Link className="btn btn--outline" href="/">Home page</Link>
      </div>
    </section>
  </main>
);

export default NotFound;
