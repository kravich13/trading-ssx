import type { Metadata } from 'next';
import Link from 'next/link';
import { MUIProvider } from './_providers';

import './globals.scss';

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
    <html lang="en">
      <body>
        <MUIProvider>
          <nav className="navbar">
            <div className="container">
              <Link href="/" className="logo">
                Trading SSX
              </Link>
              <div className="links">
                <Link href="/">Overview</Link>
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
