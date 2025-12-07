'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { Menu, X, Leaf, Wallet, User, BarChart3, ShoppingCart, Coins, HelpCircle, Settings } from 'lucide-react';

export function Navbar() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/carbon', label: 'Carbon Credits', icon: Coins },
    { href: '/farming', label: 'Yield Farming', icon: Leaf },
    { href: '/governance', label: 'Governance', icon: Settings },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-paper-white/95 backdrop-blur-md border-b border-slate-gray/10 shadow-level1">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-agri-green to-sky-teal rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl text-slate-gray group-hover:text-agri-green transition-colors">
                AgriCredit
              </div>
              <div className="text-xs text-slate-gray/60 -mt-1">Africa</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-gray/70 hover:text-agri-green hover:bg-agri-green/5 transition-all duration-200 group"
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-gray/5 rounded-full px-3 py-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-agri-green to-sky-teal rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-gray">
                    {user?.name || user?.walletAddress?.slice(0, 6) + '...'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button className="btn-primary hidden sm:flex">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-gray/5 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-gray" />
              ) : (
                <Menu className="w-6 h-6 text-slate-gray" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-gray/10 bg-paper-white/95 backdrop-blur-md animate-slideDown">
            <div className="px-4 py-6 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-gray/70 hover:text-agri-green hover:bg-agri-green/5 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              <div className="border-t border-slate-gray/10 pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-agri-green to-sky-teal rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-slate-gray">
                        {user?.name || user?.walletAddress?.slice(0, 6) + '...'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full btn-primary">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}