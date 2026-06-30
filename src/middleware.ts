import { NextRequest, NextResponse } from 'next/server'

// Only these pages redirect to / when already authenticated
const AUTH_ONLY_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  // nếu đã login mà vào /login hoặc /register → redirect về /
  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
