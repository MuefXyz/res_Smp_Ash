import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // API routes handle their own authentication
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Public routes yang tidak memerlukan authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
  ];

  // Cek apakah route adalah public
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookie or header
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // Redirect ke login jika tidak ada token
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Verify token
  const user = verifyToken(token);
  if (!user) {
    // Clear invalid token and redirect
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Role-based access control
  const protectedRoutes = {
    '/admin': ['ADMIN'],
    '/guru': ['GURU', 'ADMIN'],
    '/siswa': ['SISWA', 'ADMIN'],
    '/tu': ['TU', 'ADMIN'],
  };

  // Check role access
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(user.role)) {
        // Redirect ke dashboard sesuai role
        const dashboardRoute = getDashboardRoute(user.role);
        return NextResponse.redirect(new URL(dashboardRoute, request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'GURU':
      return '/guru';
    case 'SISWA':
      return '/siswa';
    case 'TU':
      return '/tu';
    default:
      return '/auth/login';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};