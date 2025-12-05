import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /dashboard, /loans)
  const pathname = request.nextUrl.pathname;

  // Check if the pathname starts with a locale
  const pathnameIsMissingLocale = !pathname.startsWith('/en') &&
                                  !pathname.startsWith('/fr') &&
                                  !pathname.startsWith('/sw') &&
                                  !pathname.startsWith('/ha');

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    // Get the preferred locale from the request headers
    const locale = getPreferredLocale(request);

    // e.g. incoming request is /dashboard
    // The new URL is now /en/dashboard
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }
}

function getPreferredLocale(request: NextRequest): string {
  // Get the locale from the Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const locales = ['en', 'fr', 'sw', 'ha'];
    const preferred = acceptLanguage.split(',')[0].split('-')[0];
    if (locales.includes(preferred)) {
      return preferred;
    }
  }
  return 'en'; // Default to English
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};