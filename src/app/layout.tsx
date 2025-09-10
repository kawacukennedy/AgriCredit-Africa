import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VeritasAI - ML Model Monitoring Dashboard",
  description: "Real-time machine learning model monitoring, explainability, and audit-ready reporting dashboard",
  keywords: "machine learning, ML monitoring, model explainability, AI dashboard, SHAP, audit reports",
  authors: [{ name: "VeritasAI Team" }],
  creator: "VeritasAI",
  publisher: "VeritasAI",
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-h-screen flex flex-col">
            <TopBar />
            <main className="max-w-[1400px] mx-auto w-full px-4 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
