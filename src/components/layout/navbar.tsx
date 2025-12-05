'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-agri-green">
              AgriCredit
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.dashboard')}
            </Link>
            <Link
              href="/marketplace"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.marketplace')}
            </Link>
            <Link
              href="/carbon"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {t('navigation.carbon')}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can go here */}
          </div>
          <nav className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.walletAddress?.slice(0, 6) + '...'}
                </span>
                <Button variant="outline" size="sm">
                  {t('auth.disconnect')}
                </Button>
              </div>
            ) : (
              <Button size="sm">
                {t('auth.connectWallet')}
              </Button>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}