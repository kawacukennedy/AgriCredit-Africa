'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, Mail, HelpCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-level2 border-0 text-center">
        <CardHeader className="pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-gray mb-2">
            Something went wrong
          </CardTitle>
          <p className="text-slate-gray/70">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1 btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-gray/10">
            <p className="text-sm text-slate-gray/60 mb-3">
              Need immediate assistance?
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/help" className="text-agri-green hover:text-agri-green/80 text-sm font-medium flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" />
                Help Center
              </Link>
              <Link href="/contact" className="text-agri-green hover:text-agri-green/80 text-sm font-medium flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                Contact Support
              </Link>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="pt-4 border-t border-slate-gray/10">
              <details className="text-left">
                <summary className="text-sm font-medium text-slate-gray cursor-pointer hover:text-agri-green">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}