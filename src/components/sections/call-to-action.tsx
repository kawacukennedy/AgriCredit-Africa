import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Users, DollarSign, Leaf, Shield } from 'lucide-react';

export interface CTAFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface CallToActionProps {
  title?: string;
  subtitle?: string;
  primaryCTA: {
    text: string;
    href: string;
    role?: 'farmer' | 'investor';
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  features?: CTAFeature[];
  backgroundImage?: string;
  className?: string;
}

export function CallToAction({
  title = "Ready to Transform African Agriculture?",
  subtitle = "Join thousands of farmers and investors building a sustainable future through innovative finance.",
  primaryCTA,
  secondaryCTA,
  features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "For Farmers",
      description: "Access fair loans powered by AI and blockchain technology"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "For Investors",
      description: "Generate competitive returns while supporting sustainable agriculture"
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Environmental Impact",
      description: "Support carbon sequestration and sustainable farming practices"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Transparent",
      description: "Every transaction is recorded on blockchain for complete transparency"
    }
  ],
  backgroundImage,
  className,
}: CallToActionProps) {
  return (
    <section
      className={cn(
        'py-16 relative overflow-hidden',
        backgroundImage ? 'text-white' : 'bg-gradient-to-r from-agri-green to-sky-teal text-white',
        className
      )}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for background image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-r from-agri-green/90 to-sky-teal/90" />
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm opacity-90">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="xl"
              className="bg-white text-agri-green hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-lg"
              asChild
            >
              <a href={primaryCTA.href} className="flex items-center">
                {primaryCTA.text}
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            {secondaryCTA && (
              <Button
                variant="secondary"
                size="xl"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 px-8 py-4 text-lg"
                asChild
              >
                <a href={secondaryCTA.href}>
                  {secondaryCTA.text}
                </a>
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-sm opacity-75">
            <p>
              Join our growing community of {primaryCTA.role === 'farmer' ? 'farmers' : 'investors'} making a difference
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}