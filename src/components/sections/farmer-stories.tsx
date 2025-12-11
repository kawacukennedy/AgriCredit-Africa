import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Quote, MapPin, TrendingUp, Users } from 'lucide-react';

export interface FarmerStory {
  id: string;
  name: string;
  location: string;
  crop: string;
  loanAmount: number;
  story: string;
  impact: string;
  image?: string;
  aiScore?: number;
}

export interface FarmerStoriesProps {
  title?: string;
  subtitle?: string;
  stories: FarmerStory[];
  className?: string;
}

export function FarmerStories({
  title = "Farmer Success Stories",
  subtitle = "Real farmers, real impact. See how AgriCredit Africa is transforming agriculture across the continent.",
  stories,
  className,
}: FarmerStoriesProps) {
  return (
    <section className={cn('py-16 bg-paper-white', className)}>
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
          {stories.map((story) => (
            <Card key={story.id} className="shadow-level1 border-0 overflow-hidden hover:shadow-level2 transition-all duration-300 group">
              {/* Story Image */}
              {story.image && (
                <div className="aspect-video bg-gradient-to-br from-agri-green/10 to-sky-teal/10 relative overflow-hidden">
                  <img
                    src={story.image}
                    alt={`${story.name}'s farm`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Success Story
                    </Badge>
                  </div>
                </div>
              )}

              <CardContent className="p-6">
                {/* Farmer Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-agri-green to-sky-teal rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors">
                      {story.name}
                    </h3>
                    <div className="flex items-center text-sm text-slate-gray/60">
                      <MapPin className="w-3 h-3 mr-1" />
                      {story.location}
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-gray/60">Loan Amount</span>
                    <span className="font-semibold text-agri-green">${story.loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-gray/60">Crop</span>
                    <span className="text-sm font-medium text-slate-gray">{story.crop}</span>
                  </div>
                  {story.aiScore && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-slate-gray/60">AI Score</span>
                      <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                        {story.aiScore}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Story Quote */}
                <div className="mb-4">
                  <Quote className="w-5 h-5 text-agri-green/40 mb-2" />
                  <p className="text-slate-gray/80 italic leading-relaxed">
                    "{story.story}"
                  </p>
                </div>

                {/* Impact */}
                <div className="bg-agri-green/5 border border-agri-green/10 rounded-lg p-3">
                  <p className="text-sm text-agri-green font-medium">
                    💡 {story.impact}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="btn-primary"
            asChild
          >
            <a href="/register?role=farmer">
              Join Our Farmer Community
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}