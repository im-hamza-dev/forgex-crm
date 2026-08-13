import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROUTES } from '@/constants/routes'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ROUTES.DASHBOARD
  const error = searchParams.get('error')
  const type = searchParams.get('type')

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.LOGIN}?error=${error}`)
  }

  // Invite link — redirect directly to accept-invite
  // Browser client handles hash tokens automatically
  if (type === 'invite') {
    return NextResponse.redirect(`${origin}${ROUTES.ACCEPT_INVITE}`)
  }

  // Google OAuth — PKCE code exchange
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
        )
      }

      // Check if this user has been invited (has a profile row)
      // Use service client to bypass RLS
      const serviceSupabase = createServiceClient()
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        // User authenticated with Google but was never invited
        // Sign them out and redirect with error
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=not_invited`,
        )
      }

      // Handle team member invite redirect
      if (user.user_metadata?.invited_role) {
        return NextResponse.redirect(`${origin}${ROUTES.ACCEPT_INVITE}`)
      }

      const redirectPath = next.startsWith('/') ? next : ROUTES.DASHBOARD
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
  )
}
