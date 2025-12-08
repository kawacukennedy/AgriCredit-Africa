import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './src/middleware/auth';

// Define route access rules
const routeAccessRules = {
  // Farmer routes
  '/apply': ['farmer', 'coop'],
  '/dashboard': ['farmer', 'lender', 'admin', 'coop'],
  '/profile': ['farmer', 'lender', 'admin', 'coop'],
  '/farms': ['farmer', 'coop'],

  // Lender/Investor routes
  '/marketplace': ['lender', 'investor'],
  '/portfolio': ['lender', 'investor'],
  '/loans': ['lender', 'investor'],

  // Admin routes
  '/admin': ['admin'],

  // Carbon routes (all authenticated users)
  '/carbon': ['farmer', 'lender', 'admin', 'coop', 'investor'],

  // Governance routes (all authenticated users)
  '/governance': ['farmer', 'lender', 'admin', 'coop', 'investor'],

  // NFT routes (all authenticated users)
  '/nft': ['farmer', 'lender', 'admin', 'coop', 'investor'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/help',
  '/privacy',
  '/terms',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (handled separately), and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get user from request
  const user = await getUserFromRequest(request);

  if (!user) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check route-specific access
  for (const [route, allowedRoles] of Object.entries(routeAccessRules)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect to dashboard if insufficient permissions
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      break;
    }
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.userId);
  response.headers.set('x-user-role', user.role);
  response.headers.set('x-user-email', user.email);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};