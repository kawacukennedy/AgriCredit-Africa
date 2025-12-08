'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeroProps {
  title: string;
  subtitle: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
  backgroundImage?: string;
  overlayOpacity?: number;
  className?: string;
}

export function Hero({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  backgroundImage,
  overlayOpacity = 0.4,
  className,
}: HeroProps) {
  return (
    <div
      className={cn(
        'relative min-h-[80vh] flex items-center justify-center text-center px-4',
        className
      )}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="xl"
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 text-lg"
            asChild
          >
            <a href={primaryCTA.href}>{primaryCTA.text}</a>
          </Button>
          <Button
            variant="secondary"
            size="xl"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4 text-lg"
            asChild
          >
            <a href={secondaryCTA.href}>{secondaryCTA.text}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}