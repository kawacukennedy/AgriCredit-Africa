'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/AuthModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { getAuthToken, setAuthToken, getCurrentUser } from '@/lib/api';
import Image from 'next/image';
import { ArrowRight, Shield, Zap, TrendingUp, Wallet, BarChart3, LogOut } from 'lucide-react';

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
    description: 'Access microloans without traditional banking barriers',
    icon: Shield
  },
  marketplace: {
    title: 'AI-Powered Marketplace',
    description: 'Connect with buyers and optimize pricing with AI insights',
    icon: TrendingUp
  },
  carbon: {
    title: 'Carbon Credits',
    description: 'Earn from sustainable farming through tokenized carbon credits',
    icon: Zap
  }
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { address, isConnected, connectWallet, isConnecting, error, disconnectWallet } = useWallet();
  const router = useRouter();

  const currentFeature = featureData[slides[currentSlide].key as keyof typeof featureData];

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          setAuthToken(null);
          setIsAuthenticated(false);
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleWalletAction = async () => {
    if (isConnected) {
      await disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  const handleAuthSuccess = async (authData: any) => {
    setAuthToken(authData.token);
    setIsAuthenticated(true);

    // Fetch user data if not provided
    if (authData.user) {
      setUser(authData.user);
    } else {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        addToast('error', 'Authentication Error', 'Failed to load user data');
        return;
      }
    }

    addToast('success', 'Welcome!', `Hello ${authData.user?.full_name || authData.user?.username || 'User'}!`);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    addToast('success', 'Logged out successfully');
  };

  const addToast = (type: ToastMessage['type'], title: string, message?: string, duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  const getWalletButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Disconnect Wallet';
    return 'Connect Wallet';
  };

  const handleLearnMore = () => {
    const slideKey = slides[currentSlide].key;
    switch (slideKey) {
      case 'credit':
        router.push('/loan-application');
        break;
      case 'marketplace':
        router.push('/marketplace');
        break;
      case 'carbon':
        router.push('/carbon-dashboard');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleExploreFeatures = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">AgriCredit</h1>
        <div className="flex items-center gap-4">
          {authLoading ? (
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.full_name || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
          {isConnected && address && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
                <button
                  onClick={handleWalletAction}
                  disabled={isConnecting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                 <Wallet className="w-5 h-5" />
                 <span>{getWalletButtonText()}</span>
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <currentFeature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {currentFeature.title}
                  </h3>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {currentFeature.description}
                </p>
                 <button
                   onClick={handleLearnMore}
                   className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                 >
                   <span>Learn More</span>
                   <ArrowRight className="w-4 h-4" />
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

        {/* Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              What Farmers Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from farmers who have transformed their agricultural practices with AgriCredit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Marie Claire",
                location: "Kigali, Rwanda",
                quote: "AgriCredit helped me secure my first loan without traditional banking barriers. Now I can invest in better seeds and equipment.",
                rating: 5
              },
              {
                name: "John Ochieng",
                location: "Nairobi, Kenya",
                quote: "The AI-powered marketplace helped me get fair prices for my maize harvest. My income increased by 40% this season.",
                rating: 5
              },
              {
                name: "Fatima Hassan",
                location: "Dar es Salaam, Tanzania",
                quote: "The carbon credit program allows me to earn extra income while practicing sustainable farming. It's a win-win for everyone.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 md:p-12 mb-16 text-white"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Making a real difference in African agriculture through technology and innovation
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "15,000+", label: "Farmers Supported" },
              { number: "$2.5M", label: "Loans Disbursed" },
              { number: "85%", label: "Repayment Rate" },
              { number: "50,000", label: "Tons CO₂ Sequestered" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-16 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-12"
        >
          <h3 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
            Ready to Transform Your Farm?
          </h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of African farmers who are already benefiting from decentralized finance,
            AI-powered insights, and sustainable agriculture practices. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-10 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              🚀 Start Your Journey
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExploreFeatures}
              className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-10 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-lg font-semibold"
            >
              📊 Explore Features
            </motion.button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No Credit History Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>AI-Powered Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Carbon Credit Rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
