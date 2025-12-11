'use client';

import { Hero } from '@/components/sections/hero';
import { ImpactMetrics } from '@/components/sections/impact-strip';
import { HowItWorks } from '@/components/sections/how-it-works';
import { FarmerStories } from '@/components/sections/farmer-stories';
import { InvestorTestimonials } from '@/components/sections/investor-testimonials';
import { CallToAction } from '@/components/sections/call-to-action';
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

   const farmerStories = [
     {
       id: '1',
       name: 'Grace Okafor',
       location: 'Lagos, Nigeria',
       crop: 'Cassava',
       loanAmount: 2500,
       story: 'AgriCredit helped me expand my cassava farm when traditional banks turned me down. The AI scoring was fair and transparent, and I received my loan in just 3 days.',
       impact: 'Increased production by 40% and created 2 new jobs for local youth',
       aiScore: 812
     },
     {
       id: '2',
       name: 'David Kiprop',
       location: 'Nakuru, Kenya',
       crop: 'Maize',
       loanAmount: 1800,
       story: 'As a smallholder farmer, I never thought I could access formal credit. AgriCredit changed that by using satellite data to verify my farm\'s potential.',
       impact: 'First time accessing formal credit and improved household income by 35%',
       aiScore: 745
     },
     {
       id: '3',
       name: 'Fatima Hassan',
       location: 'Kano, Nigeria',
       crop: 'Rice',
       loanAmount: 3200,
       story: 'The loan helped me invest in better seeds and irrigation. I\'ve not only repaid the loan but also generated surplus to support my community.',
       impact: 'Became a model farmer in her community and mentors 15 other women farmers',
       aiScore: 789
     }
   ];

   const investorTestimonials = [
     {
       id: '1',
       name: 'Sarah Chen',
       title: 'Impact Investment Director',
       organization: 'Green Future Fund',
       testimonial: 'AgriCredit Africa offers the perfect blend of financial returns and measurable environmental impact. Their AI-driven approach ensures we\'re investing in farmers with real potential.',
       investmentAmount: 50000,
       returns: 6250,
       returnPercentage: 12.5,
       rating: 5
     },
     {
       id: '2',
       name: 'Marcus Johnson',
       title: 'Portfolio Manager',
       organization: 'Sustainable Capital Partners',
       testimonial: 'The transparency of blockchain technology combined with AI credit scoring gives us confidence in our investments. We\'ve seen consistent returns while supporting food security.',
       investmentAmount: 75000,
       returns: 9750,
       returnPercentage: 13.0,
       rating: 5
     },
     {
       id: '3',
       name: 'Dr. Amara Okafor',
       title: 'CEO',
       organization: 'AfriAgro Ventures',
       testimonial: 'As someone passionate about African agriculture, AgriCredit represents the future. Their platform democratizes investment in smallholder farming while ensuring accountability.',
       investmentAmount: 100000,
       returns: 13200,
       returnPercentage: 13.2,
       rating: 5
     }
   ];

   return (
     <LandingPageLayout
       hero={<Hero {...heroProps} />}
       sections={[
         <ImpactMetrics key="impact" metrics={metrics} />,
         <HowItWorks key="how-it-works" title="How AgriCredit Works" steps={howItWorksSteps} />,
         <FarmerStories key="farmer-stories" stories={farmerStories} />,
         <InvestorTestimonials key="investor-testimonials" testimonials={investorTestimonials} />,
         <CallToAction
           key="cta"
           primaryCTA={{
             text: "Get Started Today",
             href: "/register",
             role: "farmer"
           }}
           secondaryCTA={{
             text: "Learn More",
             href: "/help"
           }}
         />
       ]}
     />
   );
}