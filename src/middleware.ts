import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ROUTES } from '@/constants/routes'

const PUBLIC_PATHS = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  '/portal/accept', // client portal invite accept
]

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Unauthenticated user hitting a protected route → login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.LOGIN
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user hitting auth pages → dashboard
  if (user && (pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP)) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.DASHBOARD
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
