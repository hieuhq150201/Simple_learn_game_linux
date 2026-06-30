import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const token = request.cookies.get('access_token')?.value

  if (!isPublic && !token) {
    // không redirect — game là guest-accessible, chỉ block nếu route cần auth
    return NextResponse.next()
  }

  // nếu đã login mà vào /login → redirect về /
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
