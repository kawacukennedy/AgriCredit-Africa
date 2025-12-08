import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'farmer' | 'lender' | 'admin' | 'coop';
  exp: number;
  iat: number;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('auth-token')?.value;
  if (token) {
    return token;
  }

  return null;
}

export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  return await verifyToken(token);
}

export function createAuthMiddleware(allowedRoles?: string[]) {
  return async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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

    // Check if route is public
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Get user from token
    const user = await getUserFromRequest(request);

    if (!user) {
      // Redirect to login for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Redirect to login for page routes
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to dashboard or show forbidden for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Redirect to dashboard for page routes
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Add user info to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.userId);
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-user-email', user.email);

    return response;
  };
}

// Route-specific middleware configurations
export const farmerRoutes = ['/apply', '/dashboard', '/profile', '/farms'];
export const lenderRoutes = ['/marketplace', '/portfolio', '/loans'];
export const adminRoutes = ['/admin', '/admin/*'];

export const farmerMiddleware = createAuthMiddleware(['farmer', 'coop']);
export const lenderMiddleware = createAuthMiddleware(['lender', 'investor']);
export const adminMiddleware = createAuthMiddleware(['admin']);
export const generalAuthMiddleware = createAuthMiddleware();