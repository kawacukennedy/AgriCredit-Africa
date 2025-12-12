'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';
import { Menu, X, Leaf, Wallet, User, ChevronDown, CheckCircle, Globe } from 'lucide-react';

export function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowLangMenu(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLangMenu]);

  const navigationItems = [
    { href: '#how-it-works', label: 'How It Works', external: true },
    { href: '#farmer-stories', label: 'Farmer Stories', external: true },
    { href: '#investor-testimonials', label: 'Investors', external: true },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/carbon', label: 'Carbon Credits' },
    { href: '/help', label: 'Help' },
  ];

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
    { code: 'sw', label: 'Swahili', flag: '🇹🇿' },
  ];

  const currentLang = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-agri-green to-sky-teal rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl text-foreground group-hover:text-agri-green transition-colors">
                AgriCredit
              </div>
              <div className="text-xs text-muted-foreground -mt-1">Africa</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-agri-green hover:bg-agri-green/5 transition-all duration-200 group"
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-muted/5 transition-colors"
                aria-label="Select language"
                aria-expanded={showLangMenu}
                aria-haspopup="menu"
              >
                <Globe className="w-4 h-4 text-foreground" />
                <span className="text-sm text-foreground">{currentLang.flag}</span>
                <ChevronDown className="w-3 h-3 text-foreground" />
              </Button>

              {showLangMenu && (
                <div
                  className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-xl shadow-lg z-50"
                  role="menu"
                  aria-label="Language selection menu"
                >
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-muted/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      role="menuitem"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm text-foreground">{lang.label}</span>
                      {i18n.language === lang.code && <CheckCircle className="w-4 h-4 text-agri-green ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-border hover:border-agri-green hover:text-agri-green">
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link href="/register?role=investor">
                  <Button variant="outline" size="sm" className="border-border hover:border-agri-green hover:text-agri-green">
                    Invest
                  </Button>
                </Link>
                <Link href="/register?role=farmer">
                  <Button className="btn-primary">
                    Apply as Farmer
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted/5 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Items */}
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-agri-green hover:bg-agri-green/5 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Controls */}
              <div className="border-t border-border/10 pt-4 space-y-3">
                <div className="flex space-x-2">
                  {/* Mobile Language */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex-1 border-border hover:border-agri-green hover:text-agri-green"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {currentLang.flag} {currentLang.label}
                  </Button>
                </div>

                {/* Mobile Language Menu */}
                {showLangMenu && (
                  <div className="bg-muted/5 rounded-lg p-2 space-y-1">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted/10 transition-colors"
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm text-foreground">{lang.label}</span>
                        {i18n.language === lang.code && <CheckCircle className="w-4 h-4 text-agri-green ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Auth */}
                <div className="border-t border-border/10 pt-4">
                  {isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full btn-primary">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link href="/register?role=investor" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-border hover:border-agri-green hover:text-agri-green">
                          Invest Now
                        </Button>
                      </Link>
                      <Link href="/register?role=farmer" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full btn-primary">
                          Apply as Farmer
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}