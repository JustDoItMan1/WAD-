'use client';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CartLink } from '@/components/layout/CartLink';
import { api } from '@/lib/api-client';
import type { Role } from '@/types';

interface SiteNavProps {
  role: Role | null;
  children: ReactNode;
}

const PUBLIC_LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const GUEST_LINKS = [
  { href: '/login', label: 'Log in' },
  { href: '/register', label: 'Register' },
];

export const SiteNav = ({ role, children }: SiteNavProps) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Escape closes the mobile menu
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const closeOnLink = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  };

  const logOut = async () => {
    await api.post('/auth/logout');
    router.push('/');
    router.refresh();
  };

  const links = [
    ...PUBLIC_LINKS,
    ...(role ? [{ href: '/dashboard', label: 'My orders' }] : GUEST_LINKS),
    ...(role === 'admin' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <>
      <button className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav" aria-label="Navigation"
        onClick={() => setOpen(!open)}>
        <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
          <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      </button>
      <nav className={open ? 'site-nav is-open' : 'site-nav'} id="site-nav" aria-label="Main" onClick={closeOnLink}>
        <ul role="list">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
            </li>
          ))}
          {role && (
            <li><button className="link-button" type="button" onClick={logOut}>Log out</button></li>
          )}
          <li><CartLink /></li>
        </ul>
        {children}
      </nav>
    </>
  );
};
