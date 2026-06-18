import { NextRequest, NextResponse } from 'next/server'

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isLoginPage = pathname === '/login'
  const isSetupPage = pathname.startsWith('/setup')
  const isRegisterPage = pathname === '/cadastro'

  const sessionCookie =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!sessionCookie

  if (!isLoggedIn && !isLoginPage && !isSetupPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.\\w+).*)'],
}
