import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { isLocalRequest } from './lib/utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. puść ping i next-auth tak jak było
  if (pathname.startsWith('/ping') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. jeśli to NIE jest żądanie dokumentu HTML – nie rób auth-redirectu
  const acceptsHtml = request.headers.get('accept')?.includes('text/html');
  if (!acceptsHtml) {
    return NextResponse.next();
  }

  const secureFlag = !isLocalRequest(request);

  // 3. standardowa logika auth
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: secureFlag,
  });

  if (!token) {
    const redirectUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, request.url),
    );
  }

  const isGuest = guestRegex.test(token.email ?? '');
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
