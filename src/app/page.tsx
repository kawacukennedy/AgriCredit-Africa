'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[480px] flex items-center justify-center bg-gradient-mesh bg-pattern-dots overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-agri-green-200/30 to-agri-green-400/20 rounded-full blur-3xl animate-fadeIn"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-br from-harvest-gold-200/25 to-harvest-gold-400/15 rounded-full blur-3xl animate-fadeIn" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-sky-teal-200/20 to-sky-teal-400/10 rounded-full blur-3xl animate-fadeIn" style={{ animationDelay: '0.6s' }}></div>

        {/* Subtle geometric patterns */}
        <div className="absolute top-10 right-20 w-20 h-20 border border-agri-green-300/20 rotate-45 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-16 h-16 border border-harvest-gold-300/20 rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Enhanced Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-gradient-to-r from-harvest-gold-100/80 to-harvest-gold-200/60 backdrop-blur-sm border border-harvest-gold-300/30 rounded-full shadow-lg animate-slideUp">
            <div className="w-2 h-2 bg-harvest-gold-500 rounded-full animate-pulse"></div>
            <span className="text-harvest-gold-800 font-semibold text-sm">🌟 Trusted by 1,250+ African Farmers</span>
          </div>

          {/* Enhanced Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-gray mb-8 leading-tight animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-agri-green-600 via-agri-green-500 to-sky-teal-500 bg-clip-text text-transparent">
              AgriCredit
            </span>
            <span className="block bg-gradient-to-r from-slate-gray via-slate-gray-700 to-earth-brown-600 bg-clip-text text-transparent">
              Africa
            </span>
          </h1>

          {/* Enhanced Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-slate-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed font-light animate-slideUp" style={{ animationDelay: '0.4s' }}>
            AI + Blockchain for farmer finance. Instant, transparent microloans powered by
            <span className="font-semibold bg-gradient-to-r from-agri-green-600 to-sky-teal-500 bg-clip-text text-transparent"> satellite data </span>
            and smart contracts.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12 animate-slideUp" style={{ animationDelay: '0.6s' }}>
            <Link href="/onboard">
              <Button size="lg" className="btn-primary text-lg px-10 py-5 h-auto shadow-2xl hover:shadow-harvest-gold-500/25 group">
                <span className="mr-2">🚜</span>
                Apply as Farmer
                <div className="absolute inset-0 bg-gradient-to-r from-agri-green-400 to-sky-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="glass border-2 border-harvest-gold-400/50 text-harvest-gold-700 hover:bg-harvest-gold-50 text-lg px-10 py-5 h-auto shadow-xl backdrop-blur-sm group">
                <span className="mr-2">💰</span>
                Invest Now
                <div className="absolute inset-0 bg-gradient-to-r from-harvest-gold-400/10 to-harvest-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-gray/60">
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
        </div>
      </div>
    </section>
  );
}

function ImpactStrip() {
  const metrics = [
    {
      label: 'Farmers Funded',
      value: '1,250+',
      icon: '👥',
      change: '+15%',
      gradient: 'from-agri-green-400 to-agri-green-600',
      bgColor: 'bg-agri-green-500/10'
    },
    {
      label: 'Loans Disbursed',
      value: '$2.5M+',
      icon: '💵',
      change: '+22%',
      gradient: 'from-harvest-gold-400 to-harvest-gold-600',
      bgColor: 'bg-harvest-gold-500/10'
    },
    {
      label: 'Carbon Credits',
      value: '50,000+',
      icon: '🌱',
      change: '+35%',
      gradient: 'from-sky-teal-400 to-sky-teal-600',
      bgColor: 'bg-sky-teal-500/10'
    },
    {
      label: 'Countries',
      value: '5',
      icon: '🌍',
      change: '+2',
      gradient: 'from-earth-brown-400 to-earth-brown-600',
      bgColor: 'bg-earth-brown-500/10'
    },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-agri-green-50 via-paper-white to-sky-teal-50 bg-pattern-grid"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-8 left-8 w-32 h-32 bg-agri-green-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-8 right-8 w-40 h-40 bg-harvest-gold-200/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-16 w-24 h-24 bg-sky-teal-200/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="group text-center hover-lift">
              {/* Icon with gradient background */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${metric.bgColor} mb-4 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                <div className={`text-2xl bg-gradient-to-br ${metric.gradient} bg-clip-text text-transparent`}>
                  {metric.icon}
                </div>
              </div>

              {/* Value with enhanced typography */}
              <div className="text-3xl md:text-4xl font-black mb-2 bg-gradient-to-br from-slate-gray to-slate-gray-600 bg-clip-text text-transparent group-hover:from-agri-green-600 group-hover:to-sky-teal-500 transition-all duration-300">
                {metric.value}
              </div>

              {/* Label */}
              <div className="text-sm font-medium text-slate-gray-600 mb-3 group-hover:text-slate-gray-800 transition-colors">
                {metric.label}
              </div>

              {/* Change indicator with enhanced styling */}
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full shadow-sm">
                <div className="w-1.5 h-1.5 bg-sky-teal-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-sky-teal-700">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: 'AI Credit Scoring',
      description: 'Explainable AI using satellite imagery, IoT sensors, and mobile data for fair, transparent lending decisions.',
      icon: '🛰️',
      benefits: ['No manual paperwork', 'Instant decisions', 'Bias-free scoring'],
      gradient: 'from-agri-green-500 to-sky-teal-500',
      bgGradient: 'from-agri-green-50 to-sky-teal-50',
      accentColor: 'agri-green',
    },
    {
      title: 'Smart Contracts',
      description: 'Automated loan lifecycle with transparent terms, instant disbursement, and immutable repayment tracking.',
      icon: '📋',
      benefits: ['No intermediaries', 'Automatic execution', 'Trustless system'],
      gradient: 'from-harvest-gold-500 to-harvest-gold-600',
      bgGradient: 'from-harvest-gold-50 to-harvest-gold-100',
      accentColor: 'harvest-gold',
    },
    {
      title: 'Carbon Credits',
      description: 'Tokenized environmental credits for sustainable farming practices, tradable on global markets.',
      icon: '🌱',
      benefits: ['Extra income', 'Environmental impact', 'Market trading'],
      gradient: 'from-sky-teal-500 to-agri-green-500',
      bgGradient: 'from-sky-teal-50 to-agri-green-50',
      accentColor: 'sky-teal',
    },
    {
      title: 'Mobile First',
      description: 'USSD support for feature phone, PWA for smartphones, ensuring access in low-connectivity areas.',
      icon: '📱',
      benefits: ['Works offline', 'No app store needed', 'Low data usage'],
      gradient: 'from-earth-brown-500 to-earth-brown-600',
      bgGradient: 'from-earth-brown-50 to-earth-brown-100',
      accentColor: 'earth-brown',
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-paper-white via-agri-green-50/30 to-sky-teal-50/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-pattern-dots opacity-30"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-harvest-gold-200/20 to-harvest-gold-300/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-sky-teal-200/20 to-agri-green-200/10 rounded-full blur-3xl"></div>

      <div className="container relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-full shadow-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-agri-green-500 to-sky-teal-500 rounded-full animate-pulse"></div>
            <span className="text-slate-gray-700 font-semibold">How It Works</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-black text-slate-gray mb-6 bg-gradient-to-r from-slate-gray via-slate-gray-700 to-earth-brown-600 bg-clip-text text-transparent">
            Revolutionizing Agriculture
          </h2>
          <p className="text-xl text-slate-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our AI-powered platform transforms agricultural finance through cutting-edge blockchain technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <Card key={index} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-sm">
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}></div>

              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              <CardContent className="relative p-8 lg:p-10">
                <div className="flex items-start gap-6">
                  {/* Enhanced icon */}
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl filter drop-shadow-sm">{feature.icon}</span>
                    </div>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300`}></div>
                  </div>

                  <div className="flex-1">
                    <h3 className={`text-2xl lg:text-3xl font-bold mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}>
                      {feature.title}
                    </h3>
                    <p className="text-slate-gray-600 mb-6 leading-relaxed text-lg group-hover:text-slate-gray-700 transition-colors">
                      {feature.description}
                    </p>

                    {/* Enhanced benefits */}
                    <div className="flex flex-wrap gap-3">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className={`inline-flex items-center gap-2 px-4 py-2 bg-${feature.accentColor}-100/60 border border-${feature.accentColor}-200/40 rounded-full text-sm font-medium text-${feature.accentColor}-700 shadow-sm hover:shadow-md transition-all duration-200`}>
                          <div className={`w-1.5 h-1.5 bg-${feature.accentColor}-500 rounded-full`}></div>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decorative corner element */}
                <div className={`absolute top-4 right-4 w-8 h-8 border-2 border-${feature.accentColor}-300/30 rounded-lg rotate-45 opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-gray via-earth-brown-800 to-slate-gray-900"></div>

      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-harvest-gold-500/10 via-transparent to-sky-teal-500/10"></div>
        <div className="absolute top-20 left-20 w-40 h-40 bg-harvest-gold-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-sky-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-agri-green-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-pattern-grid opacity-10"></div>

      <div className="container relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced heading */}
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-white via-harvest-gold-100 to-white bg-clip-text text-transparent leading-tight">
              Ready to Transform
              <span className="block bg-gradient-to-r from-agri-green-300 via-sky-teal-300 to-harvest-gold-300 bg-clip-text text-transparent">
                African Agriculture?
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-harvest-gold-400 to-sky-teal-400 mx-auto rounded-full"></div>
          </div>

          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-slate-gray-200 leading-relaxed font-light">
            Join thousands of farmers already benefiting from AI-powered microfinance and sustainable agricultural practices
          </p>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link href="/onboard">
              <Button size="lg" className="btn-primary text-xl px-12 py-6 h-auto shadow-2xl hover:shadow-harvest-gold-500/25 group relative overflow-hidden">
                <span className="mr-3 text-2xl">🚜</span>
                Start Your Journey
                <div className="absolute inset-0 bg-gradient-to-r from-agri-green-400 to-sky-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="glass border-2 border-white/30 text-white hover:bg-white/10 text-xl px-12 py-6 h-auto shadow-xl backdrop-blur-sm group relative overflow-hidden">
                <span className="mr-3 text-2xl">💰</span>
                Explore Marketplace
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-teal-400 rounded-full animate-pulse"></div>
              <span>100% Secure & Transparent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-harvest-gold-400 rounded-full animate-pulse"></div>
              <span>24/7 Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-agri-green-400 rounded-full animate-pulse"></div>
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <Hero />
      <ImpactStrip />
      <Features />
      <CTASection />
    </div>
  );
}