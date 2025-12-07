import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import "./globals.css";
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agricredit.africa'),
  title: 'AgriCredit Africa - AI + Blockchain for Farmer Finance',
  description: 'AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa. Instant loans, carbon credits, and marketplace for African farmers.',
  keywords: 'agriculture, blockchain, DeFi, microfinance, carbon credits, farmers, Africa, AI, sustainable farming',
  authors: [{ name: 'AgriCredit Africa' }],
  creator: 'AgriCredit Africa',
  publisher: 'AgriCredit Africa',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'AgriCredit Africa - AI + Blockchain for Farmer Finance',
    description: 'AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa.',
    url: 'https://agricredit.africa',
    siteName: 'AgriCredit Africa',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AgriCredit Africa',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgriCredit Africa - AI + Blockchain for Farmer Finance',
    description: 'AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const generateViewport = () => ({
  themeColor: '#2E7D32', // Agri green
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  colorScheme: 'light dark',
});

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-paper-white text-slate-gray">
        <Providers>
          <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;