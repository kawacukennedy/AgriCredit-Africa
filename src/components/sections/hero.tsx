'use client';

import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function Hero() {
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