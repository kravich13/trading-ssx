import { ScrollToTop } from '@/shared/ui';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import Link from 'next/link';
import NextTopLoader from 'nextjs-toploader';
import { MUIProvider } from './_providers';

import './globals.scss';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Trading SSX',
  description: 'Trading Statistics Management',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <NextTopLoader
          color="#2196f3"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #2196f3,0 0 5px #2196f3"
        />
        <MUIProvider>
          <nav className="navbar">
            <div className="container">
              <Link href="/" className="logo">
                Trading SSX
              </Link>
              <div className="links">
                <Link href="/total">Total Trades</Link>
                <Link href="/investors">Management</Link>
              </div>
            </div>
          </nav>
          <main className="container">{children}</main>
          <ScrollToTop />
        </MUIProvider>
      </body>
    </html>
  );
}
