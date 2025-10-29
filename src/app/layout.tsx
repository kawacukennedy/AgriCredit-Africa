'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import "./globals.css";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";



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
          {children}
          <AccessibilityPanel />
        </body>
      </html>
    </>
  );
}

export default RootLayout;
