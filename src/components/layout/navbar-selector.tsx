'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { LandingNavbar } from './landing-navbar';
import { FarmerNavbar } from './farmer-navbar';
import { InvestorNavbar } from './investor-navbar';

export function NavbarSelector() {
  const pathname = usePathname();

  // Determine which navbar to show based on the current route
  if (pathname === '/') {
    return <LandingNavbar />;
  } else if (pathname.startsWith('/dashboard/farmer')) {
    return <FarmerNavbar />;
  } else if (pathname.startsWith('/dashboard/investor')) {
    return <InvestorNavbar />;
  } else {
    // Default navbar for other pages (onboard, help, etc.)
    return <Navbar />;
  }
}