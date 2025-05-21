import { NextResponse } from 'next/server';

export function middleware(request) {
  const authToken = request.cookies.get('authToken')?.value;
  const protectedPaths = ['/dashboard', '/chat'];
  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    if (!authToken) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};