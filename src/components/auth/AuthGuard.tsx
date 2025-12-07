'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = '/onboard',
  fallback
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <Card className="w-full max-w-md shadow-level3">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-gray mb-2">Loading...</h2>
            <p className="text-slate-gray/70">Please wait while we verify your authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show custom fallback or redirect
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <Card className="w-full max-w-md shadow-level3">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-harvest-gold to-harvest-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-gray mb-2">Authentication Required</h2>
            <p className="text-slate-gray/70 mb-6">
              You need to connect your wallet and complete onboarding to access this page.
            </p>
            <div className="space-y-3">
              <Link href="/onboard">
                <Button className="w-full btn-primary">
                  <Wallet className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}