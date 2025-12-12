'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';
import { Menu, X, Leaf, Wallet, User, BarChart3, ShoppingCart, Coins, HelpCircle, Settings, Bell, ChevronDown, CheckCircle, AlertCircle, Zap, Search, Globe, TrendingUp, Target } from 'lucide-react';

export function InvestorNavbar() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationsRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowNotifications(false);
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
  }, [showNotifications, showLangMenu]);

  // Mock notifications
  const notifications = [
    { id: 1, type: 'success', title: 'Investment Funded', message: 'Your $5,000 investment in Green Valley Farms is now active!', time: '2 min ago' },
    { id: 2, type: 'info', title: 'Monthly Returns', message: 'Received $312.50 in returns from your portfolio', time: '1 hour ago' },
    { id: 3, type: 'warning', title: 'Loan Repayment Due', message: 'One of your loans is due for repayment in 3 days', time: '2 hours ago' }
  ];

  const unreadCount = notifications.filter(n => n.type !== 'success').length;

  const navigationItems = [
    { href: '/dashboard/investor', label: 'Dashboard', icon: BarChart3, badge: null },
    { href: '/marketplace', label: 'Invest', icon: Target, badge: null },
    { href: '/portfolio', label: 'My Portfolio', icon: TrendingUp, badge: null },
    { href: '/carbon', label: 'Carbon Trading', icon: Coins, badge: '8' },
    { href: '/governance', label: 'Governance', icon: Settings, badge: null },
    { href: '/profile', label: 'Profile', icon: User, badge: null },
    { href: '/help', label: 'Help', icon: HelpCircle, badge: null },
  ];

  const languageOptions = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
    { code: 'sw', label: 'Swahili', flag: '🇹🇿' },
  ];

  const currentLang = languageOptions.find(lang => lang.code === i18n.language) || languageOptions[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121212] border-b border-[#424242] shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard/investor" className="flex items-center space-x-3 group flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-[#1976D2] to-[#2196F3] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl text-white group-hover:text-[#2196F3] transition-colors">
                Investor Portal
              </div>
              <div className="text-xs text-[#BDBDBD] -mt-1">AgriCredit Africa</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-[#BDBDBD] hover:text-[#2196F3] hover:bg-[#2196F3]/10 transition-all duration-200 group"
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
                {item.badge && (
                  <Badge className="bg-[#2196F3]/20 text-[#2196F3] border-[#2196F3]/30 text-xs px-1.5 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          {/* Search and Controls */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BDBDBD]" />
              <input
                type="text"
                placeholder="Search investments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-10 pr-4 py-2 bg-[#1E1E1E] border border-[#424242] focus:border-[#2196F3] focus:ring-[#2196F3]/20 rounded-full text-white placeholder-[#BDBDBD]"
              />
            </div>

            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-[#1E1E1E] transition-colors text-white"
                aria-label="Select language"
                aria-expanded={showLangMenu}
                aria-haspopup="menu"
              >
                <Globe className="w-4 h-4 text-[#BDBDBD]" />
                <span className="text-sm text-[#BDBDBD]">{currentLang.flag}</span>
                <ChevronDown className="w-3 h-3 text-[#BDBDBD]" />
              </Button>

              {showLangMenu && (
                <div
                  className="absolute right-0 mt-2 w-40 bg-[#1E1E1E] border border-[#424242] rounded-xl shadow-lg z-50"
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
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-[#242424] transition-colors first:rounded-t-xl last:rounded-b-xl"
                      role="menuitem"
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm text-white">{lang.label}</span>
                      {i18n.language === lang.code && <CheckCircle className="w-4 h-4 text-[#2196F3] ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-[#1E1E1E] transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                aria-expanded={showNotifications}
                aria-haspopup="menu"
              >
                <Bell className="w-5 h-5 text-[#BDBDBD]" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-[#1E1E1E] border border-[#424242] rounded-xl shadow-lg z-50"
                  role="menu"
                  aria-label="Notifications menu"
                >
                  <div className="p-4 border-b border-[#424242]/10">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <p className="text-sm text-[#BDBDBD]">Stay updated with your investments</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-4 border-b border-[#424242]/5 hover:bg-[#242424] transition-colors cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-[#00C853]/20 text-[#00C853]' :
                            notification.type === 'warning' ? 'bg-[#FFB300]/20 text-[#FFB300]' :
                            'bg-[#2196F3]/20 text-[#2196F3]'
                          }`}>
                            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                             notification.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                             <Zap className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{notification.title}</p>
                            <p className="text-sm text-[#BDBDBD] line-clamp-2">{notification.message}</p>
                            <p className="text-xs text-[#616161] mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-[#424242]/10">
                    <Button variant="ghost" className="w-full text-sm text-[#2196F3] hover:text-[#2196F3] hover:bg-[#2196F3]/10">
                      View All Notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="hidden sm:flex items-center space-x-2 bg-[#1E1E1E] rounded-full px-3 py-1.5">
              <div className="w-6 h-6 bg-gradient-to-r from-[#1976D2] to-[#2196F3] rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-white">
                {user?.name || user?.walletAddress?.slice(0, 6) + '...'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#424242] hover:border-[#2196F3] hover:text-[#2196F3] text-white"
            >
              Disconnect
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#1E1E1E] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#424242] bg-[#121212]">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#BDBDBD]" />
                <input
                  type="text"
                  placeholder="Search investments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1E1E1E] border border-[#424242] focus:border-[#2196F3] focus:ring-[#2196F3]/20 rounded-lg text-white placeholder-[#BDBDBD]"
                />
              </div>

              {/* Mobile Navigation Items */}
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-[#BDBDBD] hover:text-[#2196F3] hover:bg-[#2196F3]/10 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="primary" className="text-xs px-1.5 py-0.5 ml-auto bg-[#2196F3]/20 text-[#2196F3]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>

              {/* Mobile Controls */}
              <div className="border-t border-[#424242]/10 pt-4 space-y-3">
                <div className="flex space-x-2">
                  {/* Mobile Language */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className="flex-1 border-[#424242] hover:border-[#2196F3] hover:text-[#2196F3] text-white"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    {currentLang.flag} {currentLang.label}
                  </Button>
                </div>

                {/* Mobile Language Menu */}
                {showLangMenu && (
                  <div className="bg-[#1E1E1E] rounded-lg p-2 space-y-1">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-[#242424] transition-colors"
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm text-white">{lang.label}</span>
                        {i18n.language === lang.code && <CheckCircle className="w-4 h-4 text-[#2196F3] ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile Auth */}
                <div className="border-t border-[#424242]/10 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#1976D2] to-[#2196F3] rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-white">
                        {user?.name || user?.walletAddress?.slice(0, 6) + '...'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-[#424242] hover:border-[#2196F3] hover:text-[#2196F3] text-white"
                    >
                      Disconnect Wallet
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}