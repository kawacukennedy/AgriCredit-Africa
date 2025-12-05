import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriCredit DApp',
  description: 'AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa',
  manifest: '/manifest.json',
  icons: {
    icon: 'data:,',
  },
};

export const generateViewport = () => ({
  themeColor: '#22c55e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
});

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <Providers>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;