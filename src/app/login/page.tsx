'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { WalletConnect } from '@/components/auth/wallet-connect';
import { useLoginMutation } from '@/store/apiSlice';
import {
  Phone,
  Wallet,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');

  const [login, { isLoading }] = useLoginMutation();

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        phone: phoneNumber,
        password: password || 'dummy', // For phone login, might not need password
      }).unwrap();
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Handle error - show toast or error message
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        phone: phoneNumber,
        verification_code: verificationCode,
      }).unwrap();
      router.push('/dashboard');
    } catch (error) {
      console.error('Verification failed:', error);
      // Handle error
    }
  };

  const handleWalletLogin = () => {
    // Wallet connection handled by WalletConnect component
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-green/5 via-sky-teal/5 to-harvest-gold/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-gray mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-gray/70">
            Sign in to access your AgriCredit account
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-level3 border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-slate-gray">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="wallet" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="wallet" className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallet" className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-slate-gray/5 rounded-xl">
                    <Wallet className="w-12 h-12 text-agri-green mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-gray mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-sm text-slate-gray/70 mb-4">
                      Use your Web3 wallet to securely sign in to AgriCredit
                    </p>
                    <WalletConnect onSuccess={handleWalletLogin} />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-px bg-slate-gray/20"></div>
                    <span className="text-xs text-slate-gray/50 uppercase tracking-wide">Or</span>
                    <div className="flex-1 h-px bg-slate-gray/20"></div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                    onClick={() => router.push('/register')}
                  >
                    Create New Account
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-6">
                {step === 'phone' ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-gray mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-4 h-4" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-slate-gray/50 mt-1">
                        We'll send a verification code to this number
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-primary"
                      disabled={isLoading || !phoneNumber}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          Send Verification Code
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerification} className="space-y-4">
                    <div className="text-center mb-6">
                      <CheckCircle className="w-12 h-12 text-sky-teal mx-auto mb-2" />
                      <h3 className="font-semibold text-slate-gray mb-1">
                        Verification Code Sent
                      </h3>
                      <p className="text-sm text-slate-gray/70">
                        We've sent a 6-digit code to {phoneNumber}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-slate-gray mb-2">
                        Verification Code
                      </label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-slate-gray/20"
                        onClick={() => setStep('phone')}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 btn-primary"
                        disabled={isLoading || verificationCode.length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </Button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        className="text-sm text-agri-green hover:text-agri-green/80"
                        onClick={() => {
                          // Resend code logic
                          console.log('Resending code...');
                        }}
                      >
                        Didn't receive code? Resend
                      </button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-gray/60">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-agri-green hover:text-agri-green/80 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-agri-green hover:text-agri-green/80 underline">
              Privacy Policy
            </Link>
          </p>
          <p className="text-sm text-slate-gray/60">
            Need help?{' '}
            <Link href="/help" className="text-agri-green hover:text-agri-green/80 underline">
              Contact Support
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <Card className="bg-sky-teal/5 border-sky-teal/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-sky-teal mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-slate-gray mb-1">Secure & Private</h4>
                <p className="text-sm text-slate-gray/70">
                  Your data is encrypted and never shared. We use blockchain technology to ensure transparency and security.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}