import { Suspense } from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { SiteNav } from '@/components/layout/SiteNav';
import { HeaderSearch } from '@/components/layout/HeaderSearch';

// Rendered on the server, so the links already match whether you are logged in
export const SiteHeader = async () => {
  const user = await getSessionUser();
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="wordmark" href="/">Tuck In</Link>
        <SiteNav role={user?.role ?? null}>
          <Suspense>
            <HeaderSearch />
          </Suspense>
        </SiteNav>
      </div>
    </header>
  );
};
