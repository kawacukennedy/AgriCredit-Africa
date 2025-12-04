import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { I18nProvider } from '@/components/I18nProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from "@/components/ThemeProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgriCredit DApp',
  description: 'AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa',
  manifest: '/manifest.json',
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
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <I18nProvider />
        <ThemeProvider>
          <AccessibilityProvider>
            <NavBar />
            <ErrorBoundary>
              <main id="main-content" className="flex-1">
                {children}
              </main>
            </ErrorBoundary>
            <Footer />
            <AccessibilityPanel />
            <OfflineIndicator />
          </AccessibilityProvider>
        </ThemeProvider>
         <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

export default RootLayout;
