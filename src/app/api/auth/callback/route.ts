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

  if (type === 'invite') {
    return NextResponse.redirect(`${origin}${ROUTES.ACCEPT_INVITE}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
        )
      }

      const serviceSupabase = createServiceClient()

      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('id, role, is_active')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        await serviceSupabase.auth.admin.deleteUser(user.id)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=not_invited`,
        )
      }

      if (!profile.is_active) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=account_inactive`,
        )
      }

      const metadata = user.user_metadata as Record<string, unknown> | undefined
      const hasInvitedRole = Boolean(metadata?.invited_role)
      const isAdmin = profile.role === 'admin'
      const wasInvited = Boolean(metadata?.invited_at) || hasInvitedRole

      if (!isAdmin && !wasInvited) {
        await serviceSupabase.from('profiles').delete().eq('id', user.id)
        await serviceSupabase.auth.admin.deleteUser(user.id)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=not_invited`,
        )
      }

      if (metadata?.invited_role) {
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
