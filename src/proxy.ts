import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROUTES } from '@/constants/routes'

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/portal/accept',
  '/api/auth',
  '/manifest.json',
  '/portal/manifest.webmanifest',
  '/sw.js',
  '/privacy',
]

const ROLE_MAP: Record<string, Record<string, boolean>> = {
  admin: {
    canViewLeads: true,
    canViewAllLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewDocs: true,
    canViewReports: true,
    canViewTeam: true,
    canViewSettings: true,
  },
  manager: {
    canViewLeads: true,
    canViewAllLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewDocs: true,
    canViewReports: false,
    canViewTeam: false,
    canViewSettings: true,
  },
  member: {
    canViewLeads: true,
    canViewAllLeads: false,
    canViewProjects: false,
    canViewTasks: true,
    canViewBlog: false,
    canViewCalendar: false,
    canViewDocs: true,
    canViewReports: false,
    canViewTeam: false,
    canViewSettings: true,
  },
}

const ROUTE_PERMISSION_MAP: Record<string, keyof (typeof ROLE_MAP)[string]> = {
  '/leads': 'canViewLeads',
  '/projects': 'canViewProjects',
  '/tasks': 'canViewTasks',
  '/blog': 'canViewBlog',
  '/content-calendar': 'canViewCalendar',
  '/docs': 'canViewDocs',
  '/reports': 'canViewReports',
  '/team': 'canViewTeam',
  '/settings': 'canViewSettings',
  '/dashboard': 'canViewLeads',
  '/notifications': 'canViewLeads',
}

function loginErrorUrl(request: NextRequest, error: string) {
  const url = request.nextUrl.clone()
  url.pathname = ROUTES.LOGIN
  url.search = ''
  url.searchParams.set('error', error)
  return url
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const redirect = NextResponse.redirect(url)
  source.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value)
  })
  return redirect
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  if (isPublic) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    url.pathname = ROUTES.LOGIN
    return NextResponse.redirect(url)
  }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, is_active')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.auth.signOut()
    return redirectWithCookies(loginErrorUrl(request, 'not_invited'), response)
  }

  if (!profile.is_active) {
    await supabase.auth.signOut()
    return redirectWithCookies(
      loginErrorUrl(request, 'account_inactive'),
      response,
    )
  }

  const role = profile.role as string
  const isPortal = pathname === '/portal' || pathname.startsWith('/portal/')

  if (role === 'client') {
    if (
      isPortal ||
      pathname.startsWith('/api/portal/') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/notifications')
    ) {
      if (isPortal) {
        const { data: clientAccount } = await service
          .from('client_accounts')
          .select('project_id, status')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()

        if (!clientAccount) {
          await supabase.auth.signOut()
          return redirectWithCookies(
            loginErrorUrl(request, 'not_invited'),
            response,
          )
        }

        if (clientAccount.status === 'revoked') {
          await supabase.auth.signOut()
          return redirectWithCookies(
            loginErrorUrl(request, 'access_revoked'),
            response,
          )
        }

        if (pathname === '/portal' || pathname === '/portal/') {
          url.pathname = `/portal/${clientAccount.project_id}`
          return redirectWithCookies(url, response)
        }
      }

      return response
    }

    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  if (isPortal) {
    url.pathname = ROUTES.DASHBOARD
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/')) {
    return response
  }

  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (matchedRoute) {
    const permission = ROUTE_PERMISSION_MAP[matchedRoute]!
    const permissions = ROLE_MAP[role] ?? ROLE_MAP.member!
    if (!permissions[permission]) {
      url.pathname = ROUTES.DASHBOARD
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
