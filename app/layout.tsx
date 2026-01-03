import type { Metadata } from 'next';
import Link from 'next/link';
import { Roboto } from 'next/font/google';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>
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
        </MUIProvider>
      </body>
    </html>
  );
}
