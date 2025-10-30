'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import "./globals.css";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";



function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(error => {
          console.log('SW registration failed: ', error);
        });
    }
  }, []);

  return (
    <>
      <Head>
        <title>AgriCredit DApp</title>
        <meta name="description" content="AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <html lang="en">
        <body
          className="antialiased"
        >
          <a href="#main-content" className="skip-link">Skip to main content</a>
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
        </body>
      </html>
    </>
  );
}

export default RootLayout;
