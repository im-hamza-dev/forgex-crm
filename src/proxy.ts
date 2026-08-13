import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ROUTES } from '@/constants/routes'

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/setup',
  '/api/auth',
  '/portal/accept',
]

const PROTECTED_ROUTES = [
  { path: '/projects',         permission: 'canViewProjects' },
  { path: '/blog',             permission: 'canViewBlog'     },
  { path: '/content-calendar', permission: 'canViewCalendar' },
  { path: '/reports',          permission: 'canViewReports'  },
  { path: '/team',             permission: 'canViewTeam'     },
]

const ROLE_MAP: Record<string, Record<string, boolean>> = {
  admin: {
    canViewProjects: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewReports: true,
    canViewTeam: true,
  },
  manager: {
    canViewProjects: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewReports: false,
    canViewTeam: false,
  },
  member: {
    canViewProjects: false,
    canViewBlog: false,
    canViewCalendar: false,
    canViewReports: false,
    canViewTeam: false,
  },
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isApi    = pathname.startsWith('/api/')
  const isPortal = pathname.startsWith('/portal/')

  if (isApi) return supabaseResponse

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Block /setup if any admin profile already exists
  if (pathname === '/setup') {
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (existingAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  if (isPublic) return supabaseResponse

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (isPortal) return supabaseResponse

  // Query profile — no recursion since we use service role pattern
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    // On RLS or DB error — sign out and redirect to be safe
    console.error('[proxy] Profile query error:', profileError.message)
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'not_invited')
    return NextResponse.redirect(url)
  }

  if (!profile) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'not_invited')
    return NextResponse.redirect(url)
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'account_inactive')
    return NextResponse.redirect(url)
  }

  const role = (profile.role as string) ?? 'member'

  // Block client portal users from CRM routes
  if ((profile.role as string) === 'client' || !Object.keys(ROLE_MAP).includes(role)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const permissions = ROLE_MAP[role] ?? ROLE_MAP.member!

  const protectedRoute = PROTECTED_ROUTES.find((r) =>
    pathname.startsWith(r.path),
  )

  if (protectedRoute && !permissions[protectedRoute.permission]) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}