import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Protect /dashboard and /settings — unauthenticated users are redirected to the login page
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/settings')

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
