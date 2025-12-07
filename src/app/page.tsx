'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[480px] flex items-center justify-center bg-gradient-to-br from-agri-green/5 via-paper-white to-sky-teal/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-agri-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-harvest-gold rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-sky-teal rounded-full blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20">
            🌟 Trusted by 1,250+ African Farmers
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-gray mb-6 leading-tight">
            AgriCredit
            <span className="block text-agri-green">Africa</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-slate-gray/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            AI + Blockchain for farmer finance. Instant, transparent microloans powered by satellite data and smart contracts.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/onboard">
              <Button size="lg" className="btn-primary text-lg px-8 py-4 h-auto">
                🚜 Apply as Farmer
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="btn-secondary text-lg px-8 py-4 h-auto border-harvest-gold text-harvest-gold hover:bg-harvest-gold hover:text-slate-gray">
                💰 Invest Now
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
    { label: 'Farmers Funded', value: '1,250+', icon: '👥', change: '+15%' },
    { label: 'Loans Disbursed', value: '$2.5M+', icon: '💵', change: '+22%' },
    { label: 'Carbon Credits', value: '50,000+', icon: '🌱', change: '+35%' },
    { label: 'Countries', value: '5', icon: '🌍', change: '+2' },
  ];

  return (
    <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map((metric, index) => (
            <div key={index} className="group">
              <div className="text-3xl mb-2">{metric.icon}</div>
              <div className="text-3xl md:text-4xl font-black mb-1 group-hover:scale-110 transition-transform duration-300">
                {metric.value}
              </div>
              <div className="text-sm opacity-90 mb-1">{metric.label}</div>
              <div className="text-xs bg-white/20 rounded-full px-2 py-1 inline-block">
                {metric.change}
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
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Smart Contracts',
      description: 'Automated loan lifecycle with transparent terms, instant disbursement, and immutable repayment tracking.',
      icon: '📋',
      benefits: ['No intermediaries', 'Automatic execution', 'Trustless system'],
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Carbon Credits',
      description: 'Tokenized environmental credits for sustainable farming practices, tradable on global markets.',
      icon: '🌱',
      benefits: ['Extra income', 'Environmental impact', 'Market trading'],
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Mobile First',
      description: 'USSD support for feature phones, PWA for smartphones, ensuring access in low-connectivity areas.',
      icon: '📱',
      benefits: ['Works offline', 'No app store needed', 'Low data usage'],
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <section className="py-20 bg-paper-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-gray mb-4">
            How AgriCredit Works
          </h2>
          <p className="text-xl text-slate-gray/70 max-w-2xl mx-auto">
            Our AI-powered platform revolutionizes agricultural finance through blockchain technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <Card key={index} className="card group hover:shadow-level3 transition-all duration-300 border-0 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-gray mb-3 group-hover:text-agri-green transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-gray/70 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {feature.benefits.map((benefit, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-agri-green/10 text-agri-green border-agri-green/20">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
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
    <section className="py-20 bg-gradient-to-br from-slate-gray to-earth-brown text-white">
      <div className="container text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-6">
          Ready to Transform African Agriculture?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Join thousands of farmers already benefiting from AI-powered microfinance
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboard">
            <Button size="lg" className="bg-harvest-gold hover:bg-harvest-gold/90 text-slate-gray font-bold text-lg px-8 py-4 h-auto">
              Start Your Journey 🚜
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-gray text-lg px-8 py-4 h-auto">
              Explore Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ImpactStrip />
      <Features />
      <CTASection />
      <Footer />
    </div>
  );
}

function ImpactStrip() {
  const metrics = [
    { label: 'Farmers Funded', value: '1,250+' },
    { label: 'Loans Disbursed', value: '$2.5M+' },
    { label: 'Carbon Credits', value: '50,000+' },
    { label: 'Countries', value: '5' },
  ];

  return (
    <section className="bg-agri-green text-white py-8">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="text-2xl md:text-3xl font-bold">{metric.value}</div>
              <div className="text-sm opacity-90">{metric.label}</div>
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
      description: 'Explainable AI using satellite imagery and mobile data for fair lending decisions.',
      icon: '🛰️',
    },
    {
      title: 'Smart Contracts',
      description: 'Automated loan lifecycle with transparent terms and instant disbursement.',
      icon: '📋',
    },
    {
      title: 'Carbon Credits',
      description: 'Tokenized environmental credits for sustainable farming practices.',
      icon: '🌱',
    },
    {
      title: 'Mobile First',
      description: 'USSD support for feature phones in low-connectivity areas.',
      icon: '📱',
    },
  ];

  return (
    <section className="py-16 bg-paper-white">
      <div className="container">
        <h2 className="text-3xl font-bold text-center text-slate-gray mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-slate-gray mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-gray/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ImpactStrip />
      <Features />
      <Footer />
    </div>
  );
}