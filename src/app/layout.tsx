import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { appWithTranslation } from 'next-i18next';
import "./globals.css";
import "../utils/i18n";
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
};

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

export default appWithTranslation(RootLayout);
