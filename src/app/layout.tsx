'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from 'react';
import "./globals.css";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriCredit DApp",
  description: "AI-Blockchain platform for decentralized microcredit and sustainable agriculture in Africa",
  manifest: "/manifest.json",
  themeColor: "#22c55e",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <AccessibilityPanel />
      </body>
    </html>
  );
}

export default RootLayout;
