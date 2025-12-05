'use client';

import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { useTranslation } from 'react-i18next';

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative h-[480px] flex items-center justify-center bg-gradient-to-br from-agri-green/10 to-sky-teal/10">
      <div className="container text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-gray mb-4">
          AgriCredit Africa
        </h1>
        <p className="text-xl md:text-2xl text-slate-gray/80 mb-8 max-w-3xl mx-auto">
          AI + Blockchain for farmer finance. Instant, transparent microloans powered by satellite data and smart contracts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-agri-green hover:bg-agri-green/90">
            Apply as Farmer
          </Button>
          <Button size="lg" variant="outline" className="border-harvest-gold text-harvest-gold hover:bg-harvest-gold hover:text-white">
            Invest Now
          </Button>
        </div>
      </div>
    </section>
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