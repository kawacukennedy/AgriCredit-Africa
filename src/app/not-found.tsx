'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-level2 border-0 text-center">
        <CardHeader className="pb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-gray mb-2">
            Page Not Found
          </CardTitle>
          <p className="text-slate-gray/70">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button className="w-full btn-primary">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-gray/10">
            <p className="text-sm text-slate-gray/60 mb-3">
              Need help? Check out our resources:
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/help" className="text-agri-green hover:text-agri-green/80 text-sm font-medium">
                Help Center
              </Link>
              <Link href="/contact" className="text-agri-green hover:text-agri-green/80 text-sm font-medium">
                Contact Us
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}