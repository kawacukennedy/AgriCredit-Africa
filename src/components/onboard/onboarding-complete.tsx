'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Trophy, Users, TrendingUp, ArrowRight } from 'lucide-react';

interface OnboardingCompleteProps {
  onComplete: () => void;
  profileData: any;
}

export function OnboardingComplete({ onComplete, profileData }: OnboardingCompleteProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <Trophy className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Welcome to AgriCredit Africa!</h3>
        <p className="text-muted-foreground text-lg">
          Your onboarding is complete. You're now part of our decentralized farming community.
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Your Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700">Farm Name</p>
              <p className="font-semibold text-green-800">{profileData.farmName}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Location</p>
              <p className="font-semibold text-green-800">{profileData.farmLocation}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Primary Crop</p>
              <p className="font-semibold text-green-800 capitalize">{profileData.primaryCrop}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Farm Size</p>
              <p className="font-semibold text-green-800">{profileData.farmSize} hectares</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-agri-green text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-semibold">Explore the Dashboard</h4>
                <p className="text-muted-foreground text-sm">
                  View your personalized farming insights, market data, and available loan options.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-agri-green text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-semibold">Apply for Your First Loan</h4>
                <p className="text-muted-foreground text-sm">
                  Use our AI-powered credit scoring to get competitive loan terms for your farming needs.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-agri-green text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-semibold">Join the Community</h4>
                <p className="text-muted-foreground text-sm">
                  Participate in governance, access carbon markets, and connect with other farmers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Your Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✓ Decentralized Identity
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ✓ AI-Powered Credit Scoring
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              ✓ Carbon Credit Access
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              ✓ Governance Participation
            </Badge>
            <Badge variant="secondary" className="bg-teal-100 text-teal-800">
              ✓ Market Intelligence
            </Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              ✓ Community Support
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button onClick={onComplete} size="lg" className="px-8">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Your DID: {profileData.did}
        </p>
      </div>
    </div>
  );
}