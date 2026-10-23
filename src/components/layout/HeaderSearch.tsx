'use client';
import { useSearchParams } from 'next/navigation';

// A plain GET form: it works without JavaScript and lands on /menu?q=…
export const HeaderSearch = () => {
  const query = useSearchParams().get('q') ?? '';
  return (
    <form className="header-search" action="/menu" method="get" role="search">
      <label className="visually-hidden" htmlFor="site-search">Search the price list</label>
      <input key={query} type="search" id="site-search" name="q" placeholder="Search" autoComplete="off" defaultValue={query} />
      <button className="btn btn--sm btn--outline" type="submit">Search</button>
    </form>
  );
};
