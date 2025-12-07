'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { WalletConnect } from '@/components/auth/wallet-connect';
import {
  User,
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Users,
  Leaf,
  TrendingUp
} from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'farmer';
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'role' | 'details' | 'verify'>('role');
  const [formData, setFormData] = useState({
    role: role,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    acceptTerms: false
  });

  const handleRoleSelect = (selectedRole: string) => {
    setFormData({ ...formData, role: selectedRole });
    setStep('details');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
    }, 2000);
  };

  const handleWalletRegister = () => {
    // Wallet registration handled by WalletConnect component
    router.push('/onboard');
  };

  const roleOptions = [
    {
      id: 'farmer',
      title: 'Smallholder Farmer',
      description: 'Apply for microloans, earn carbon credits, and access farming tools',
      icon: Users,
      benefits: ['Instant loans up to $5,000', 'AI credit scoring', 'Carbon credit rewards'],
      color: 'agri-green'
    },
    {
      id: 'investor',
      title: 'Lender/Investor',
      description: 'Fund loans, earn returns, and support sustainable agriculture',
      icon: TrendingUp,
      benefits: ['Competitive returns', 'Blockchain security', 'Impact investing'],
      color: 'sky-teal'
    },
    {
      id: 'coop',
      title: 'Cooperative Agent',
      description: 'Help farmers access credit and manage cooperative lending',
      icon: Shield,
      benefits: ['Commission-based earnings', 'Community impact', 'Training provided'],
      color: 'harvest-gold'
    }
  ];

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-agri-green/5 via-sky-teal/5 to-harvest-gold/5 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-gray mb-2">
              Join AgriCredit Africa
            </h1>
            <p className="text-slate-gray/70">
              Choose your role and start your journey in sustainable agriculture finance
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            {roleOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-level3 border-0 ${
                    formData.role === option.id ? 'ring-2 ring-agri-green shadow-level3' : 'shadow-level1'
                  }`}
                  onClick={() => handleRoleSelect(option.id)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 bg-${option.color}/10 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className={`w-6 h-6 text-${option.color}`} />
                    </div>
                    <CardTitle className="text-slate-gray">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-gray/70 mb-4 text-center">
                      {option.description}
                    </p>
                    <div className="space-y-2">
                      {option.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className={`w-4 h-4 text-${option.color} flex-shrink-0`} />
                          <span className="text-sm text-slate-gray/80">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-gray/60">
              Already have an account?{' '}
              <Link href="/login" className="text-agri-green hover:text-agri-green/80 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-agri-green/5 via-sky-teal/5 to-harvest-gold/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-gray mb-2">
              Create Your Account
            </h1>
            <p className="text-slate-gray/70">
              Join as a {roleOptions.find(r => r.id === formData.role)?.title.toLowerCase()}
            </p>
          </div>

          {/* Registration Form */}
          <Card className="shadow-level3 border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-slate-gray">Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-gray mb-2">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-gray mb-2">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-gray mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-gray mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 700 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-gray mb-2">
                    Country
                  </label>
                  <select
                    id="country"
                    className="w-full px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="kenya">Kenya</option>
                    <option value="nigeria">Nigeria</option>
                    <option value="ghana">Ghana</option>
                    <option value="tanzania">Tanzania</option>
                    <option value="uganda">Uganda</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-slate-gray/70">
                    I agree to the{' '}
                    <Link href="/terms" className="text-agri-green hover:text-agri-green/80 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-agri-green hover:text-agri-green/80 underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-primary"
                  disabled={isLoading || !formData.acceptTerms}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alternative Registration */}
          <div className="text-center">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 h-px bg-slate-gray/20"></div>
              <span className="text-xs text-slate-gray/50 uppercase tracking-wide">Or</span>
              <div className="flex-1 h-px bg-slate-gray/20"></div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-gray/5 rounded-xl">
                <Wallet className="w-8 h-8 text-agri-green mx-auto mb-2" />
                <p className="text-sm text-slate-gray/70 mb-3">
                  Register with your Web3 wallet for faster onboarding
                </p>
                <WalletConnect onSuccess={handleWalletRegister} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-gray/60">
              Already have an account?{' '}
              <Link href="/login" className="text-agri-green hover:text-agri-green/80 underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-agri-green/5 via-sky-teal/5 to-harvest-gold/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-sky-teal mx-auto mb-4" />
            <h1 className="text-3xl font-black text-slate-gray mb-2">
              Account Created!
            </h1>
            <p className="text-slate-gray/70">
              Welcome to AgriCredit Africa, {formData.firstName}!
            </p>
          </div>

          {/* Success Message */}
          <Card className="shadow-level3 border-0">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="p-4 bg-sky-teal/5 rounded-xl">
                  <h3 className="font-semibold text-slate-gray mb-2">What's Next?</h3>
                  <div className="space-y-2 text-sm text-slate-gray/70">
                    <p>✅ Account verification in progress</p>
                    <p>📱 Phone number verified</p>
                    <p>🎯 Role: {roleOptions.find(r => r.id === formData.role)?.title}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full btn-primary"
                    onClick={() => router.push('/onboard')}
                  >
                    Complete Your Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                    onClick={() => router.push('/dashboard')}
                  >
                    Explore Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-agri-green/5 border-agri-green/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Leaf className="w-5 h-5 text-agri-green mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-slate-gray mb-1">Get Started</h4>
                  <p className="text-sm text-slate-gray/70">
                    Complete your profile to unlock personalized loan recommendations and start earning carbon credits from day one.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}