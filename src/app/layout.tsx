import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers, SiteFooter, SiteHeader } from '@/components/layout';
import '@/styles/styles.css';

// Loaded with a <link> because next/font makes Turbopack's dev server reload in a loop (Next 16.4)
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;700&family=Big+Shoulders+Display:wght@800;900&display=swap';


export const metadata: Metadata = {
  title: { default: 'Tuck In', template: '%s | Tuck In' },
  description: 'Order russian rolls, boerewors rolls, chips and cold drinks from the Block C tuckshop and collect them without queuing.',
  icons: { icon: '/images/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1f4fa3',
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS_URL} />
    </head>
    <body>
      <Providers>
        <a className="skip-link" href="#main">Skip to main content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </Providers>
    </body>
  </html>
);

export default RootLayout;
