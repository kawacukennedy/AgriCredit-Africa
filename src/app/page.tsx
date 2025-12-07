'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, TrendingUp, Users, DollarSign, Leaf, Globe } from 'lucide-react';

function Hero() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  if (hasError) {
    return (
      <section className="relative min-h-[480px] flex items-center justify-center bg-gradient-to-br from-agri-green/5 via-paper-white to-sky-teal/5">
        <div className="container text-center">
          <div className="max-w-md mx-auto">
            <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-gray mb-2">Something went wrong</h2>
            <p className="text-slate-gray/70 mb-6">We couldn't load the page content. Please try again.</p>
            <Button onClick={handleRetry} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[480px] flex items-center justify-center bg-gradient-to-br from-agri-green/5 via-paper-white to-sky-teal/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-agri-green rounded-full blur-3xl animate-fadeIn"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-harvest-gold rounded-full blur-3xl animate-fadeIn" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-sky-teal rounded-full blur-3xl animate-fadeIn" style={{ animationDelay: '0.4s' }}></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {isLoading ? (
            // Loading skeleton for hero
            <div className="space-y-6">
              <div className="loading-skeleton h-8 w-64 mx-auto rounded"></div>
              <div className="loading-skeleton h-16 w-full max-w-2xl mx-auto rounded"></div>
              <div className="loading-skeleton h-6 w-3/4 mx-auto rounded"></div>
              <div className="flex justify-center gap-4">
                <div className="loading-skeleton h-12 w-40 rounded"></div>
                <div className="loading-skeleton h-12 w-40 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <Badge variant="secondary" className="mb-6 bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 animate-fadeIn">
                🌟 Trusted by African Farmers
              </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-gray mb-6 leading-tight animate-slideUp">
            AgriCredit
            <span className="block text-agri-green">Africa</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-slate-gray/80 mb-8 max-w-3xl mx-auto leading-relaxed animate-slideUp" style={{ animationDelay: '0.2s' }}>
            AI + Blockchain for farmer finance
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8 animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <Link href="/onboard">
                  <Button size="lg" className="btn-primary text-lg px-8 py-4 h-auto">
                    Apply as Farmer
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button size="lg" variant="outline" className="btn-secondary text-lg px-8 py-4 h-auto border-harvest-gold text-harvest-gold hover:bg-harvest-gold hover:text-slate-gray">
                    Invest Now
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-gray/60 animate-slideUp" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-teal rounded-full"></div>
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-agri-green rounded-full"></div>
                  <span>Instant Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-harvest-gold rounded-full"></div>
                  <span>Carbon Credits</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ImpactStrip() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate loading metrics
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const metrics = [
    { label: 'Farmers reached', value: '—', icon: Users },
  ];

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <section className="bg-agri-green text-white py-12">
      <div className="container">
        {hasError ? (
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-harvest-gold mx-auto mb-2" />
            <p className="text-sm opacity-90 mb-4">Unable to load metrics</p>
            <Button onClick={handleRetry} size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-agri-green">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 text-center">
            {isLoading ? (
              // Loading skeleton for metrics
              <div className="loading-skeleton h-16 w-48 mx-auto rounded"></div>
            ) : (
              metrics.map((metric, index) => (
                <div key={index} className="group animate-fadeIn">
                  <div className="flex justify-center mb-2">
                    <metric.icon className="w-8 h-8 text-harvest-gold" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-1 group-hover:scale-110 transition-transform duration-300">
                    {metric.value}
                  </div>
                  <div className="text-sm opacity-90">{metric.label}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Empty state component for when no data is available
function EmptyState() {
  return (
    <section className="py-20 bg-paper-white">
      <div className="container text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-agri-green/20 to-sky-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-12 h-12 text-agri-green" />
          </div>
          <h3 className="text-2xl font-bold text-slate-gray mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-slate-gray/70 mb-8">
            Join the growing community of African farmers benefiting from AI-powered microfinance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboard">
              <Button className="btn-primary">
                Apply as Farmer
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" className="btn-secondary">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Global error banner component
function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-error/10 border-b border-error/20 py-3">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <span className="text-sm text-slate-gray">
              Some features may not be available. Please check your connection.
            </span>
          </div>
          <Button onClick={onRetry} size="sm" variant="outline" className="border-error text-error hover:bg-error hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Show empty state after a delay to demonstrate functionality
    const timer = setTimeout(() => {
      setShowEmptyState(true);
    }, 5000);

    // Simulate occasional error for demonstration
    const errorTimer = setTimeout(() => {
      setShowError(true);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(errorTimer);
    };
  }, []);

  const handleRetry = () => {
    setShowError(false);
    // Reset other states if needed
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      {showError && <ErrorBanner onRetry={handleRetry} />}
      <Hero />
      <ImpactStrip />
      {showEmptyState && <EmptyState />}
      <Footer />
    </div>
  );
}