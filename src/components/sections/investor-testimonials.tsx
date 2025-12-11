import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Quote, Star, TrendingUp, DollarSign } from 'lucide-react';

export interface InvestorTestimonial {
  id: string;
  name: string;
  title: string;
  organization: string;
  testimonial: string;
  investmentAmount: number;
  returns: number;
  returnPercentage: number;
  image?: string;
  rating: number;
}

export interface InvestorTestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials: InvestorTestimonial[];
  className?: string;
}

export function InvestorTestimonials({
  title = "What Investors Are Saying",
  subtitle = "Join impact investors who are generating returns while supporting sustainable agriculture across Africa.",
  testimonials,
  className,
}: InvestorTestimonialsProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'w-4 h-4',
          i < rating ? 'text-harvest-gold fill-harvest-gold' : 'text-slate-gray/20'
        )}
      />
    ));
  };

  return (
    <section className={cn('py-16 bg-slate-gray/5', className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-gray mb-4">
            {title}
          </h2>
          <p className="text-lg text-slate-gray/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="shadow-level1 border-0 overflow-hidden hover:shadow-level2 transition-all duration-300 group">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {renderStars(testimonial.rating)}
                  <span className="ml-2 text-sm text-slate-gray/60">
                    ({testimonial.rating}/5)
                  </span>
                </div>

                {/* Testimonial Quote */}
                <div className="mb-6">
                  <Quote className="w-5 h-5 text-agri-green/40 mb-3" />
                  <p className="text-slate-gray/80 leading-relaxed italic">
                    "{testimonial.testimonial}"
                  </p>
                </div>

                {/* Investor Info */}
                <div className="flex items-center space-x-3 mb-4">
                  {testimonial.image ? (
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-teal to-agri-green rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-slate-gray/60">
                      {testimonial.title}
                    </p>
                    <p className="text-sm text-slate-gray/60">
                      {testimonial.organization}
                    </p>
                  </div>
                </div>

                {/* Investment Results */}
                <div className="bg-sky-teal/5 border border-sky-teal/10 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-3 h-3 text-sky-teal" />
                        <span className="text-xs text-slate-gray/60 ml-1">Invested</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-gray">
                        ${testimonial.investmentAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <TrendingUp className="w-3 h-3 text-agri-green" />
                        <span className="text-xs text-slate-gray/60 ml-1">Returns</span>
                      </div>
                      <p className="text-sm font-semibold text-agri-green">
                        +${testimonial.returns.toLocaleString()} ({testimonial.returnPercentage}%)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-agri-green text-agri-green hover:bg-agri-green hover:text-white"
            asChild
          >
            <a href="/register?role=investor">
              Start Investing Today
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}