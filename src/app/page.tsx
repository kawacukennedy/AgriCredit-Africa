'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import Image from 'next/image';

const slides = [
  {
    key: "credit",
    image: "/globe.svg"
  },
  {
    key: "marketplace",
    image: "/file.svg"
  },
  {
    key: "carbon",
    image: "/window.svg"
  }
];

const featureData = {
  credit: {
    title: 'Decentralized Credit',
    description: 'Access microloans without traditional banking barriers'
  },
  marketplace: {
    title: 'AI-Powered Marketplace',
    description: 'Connect with buyers and optimize pricing with AI insights'
  },
  carbon: {
    title: 'Carbon Credits',
    description: 'Earn from sustainable farming through tokenized carbon credits'
  }
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { address, isConnected, connectWallet, isConnecting, error, disconnectWallet } = useWallet();

  const currentFeature = featureData[slides[currentSlide].key as keyof typeof featureData];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleWalletAction = async () => {
    if (isConnected) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  const getWalletButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Disconnect Wallet';
    return 'Connect Wallet';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">AgriCredit</h1>
        <div className="flex items-center gap-4">
          {isConnected && address && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
          <button
            onClick={handleWalletAction}
            disabled={isConnecting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {getWalletButtonText()}
          </button>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </header>

      {/* Hero Section with Carousel */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4"
          >
            AgriCredit Africa
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Decentralized microcredit for sustainable agriculture
          </motion.p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                 <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                   {currentFeature.title}
                 </h3>
                 <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                   {currentFeature.description}
                 </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Learn More
                </button>
              </div>
              <div className="flex-1">
                <Image
                  src={slides[currentSlide].image}
                  alt={currentFeature.title}
                  width={600}
                  height={256}
                  className="w-full h-64 object-contain"
                />
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            ›
          </button>

          {/* Dots */}
          <div className="flex justify-center mt-6 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Get Started
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
              Explore Features
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
            Get Started
            </button>
            <button className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-lg font-semibold">
            Explore Features
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
