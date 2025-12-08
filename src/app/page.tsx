'use client';

import { Hero } from '@/components/sections/hero';
import { ImpactMetrics } from '@/components/sections/impact-strip';
import { HowItWorks } from '@/components/sections/how-it-works';
import { LandingPageLayout } from '@/components/layout/landing-page-layout';

export default function Home() {
  const heroProps = {
    title: "AgriCredit Africa",
    subtitle: "AI + Blockchain for Farmer Finance",
    primaryCTA: {
      text: "Apply as Farmer",
      href: "/register?role=farmer"
    },
    secondaryCTA: {
      text: "Invest Now",
      href: "/register?role=investor"
    },
    backgroundImage: "/hero-background.jpg",
    overlayOpacity: 0.4
  };

  const metrics = [
    { label: 'Farmers Reached', value: '10,000+', icon: '👥', trend: 'up' as const },
    { label: 'Loans Disbursed', value: '$2.5M+', icon: '💰', trend: 'up' as const },
    { label: 'Carbon Credits', value: '50,000+', icon: '🌱', trend: 'up' as const },
    { label: 'Repayment Rate', value: '92%', icon: '✅', trend: 'stable' as const },
  ];

  const howItWorksSteps = [
    {
      title: 'Create Profile',
      description: 'Register with phone or wallet, create your digital identity (DID)',
      icon: '👤',
      color: 'bg-primary-500'
    },
    {
      title: 'Add Farm Details',
      description: 'Geolocate your farm, add crops, and grant satellite data access',
      icon: '🌾',
      color: 'bg-primary-600'
    },
    {
      title: 'Get AI Credit Score',
      description: 'Our AI analyzes satellite, weather, and mobile data for instant scoring',
      icon: '🤖',
      color: 'bg-primary-700'
    },
    {
      title: 'Receive Loan',
      description: 'Get funded in hours through smart contracts',
      icon: '💰',
      color: 'bg-primary-800'
    }
  ];

  return (
    <LandingPageLayout
      hero={<Hero {...heroProps} />}
      sections={[
        <ImpactMetrics key="impact" metrics={metrics} />,
        <HowItWorks key="how-it-works" title="How AgriCredit Works" steps={howItWorksSteps} />
      ]}
    />
  );
}