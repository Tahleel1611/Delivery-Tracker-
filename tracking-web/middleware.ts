import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const protectedRoles = [
  { prefix: '/admin', role: 'ADMIN' },
  { prefix: '/buyer', role: 'BUYER' },
  { prefix: '/driver', role: 'DRIVER' }
] as const;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedRoles.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== protectedRoute.role) {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/buyer/:path*', '/driver/:path*']
};