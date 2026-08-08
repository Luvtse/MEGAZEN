import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MEGAZEN - Maritime Logistics Platform',
  description: 'Enterprise maritime logistics management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0a0a0a] text-white dark">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
