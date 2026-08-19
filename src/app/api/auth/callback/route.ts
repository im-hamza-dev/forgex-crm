import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ROUTES } from '@/constants/routes'

function isClientUser(
  role: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
) {
  return (
    role === 'client' ||
    metadata?.invited_role === 'client' ||
    metadata?.is_client === true
  )
}

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

    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
      )
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(
        `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
      )
    }

    const service = createServiceClient()
    const metadata = user.user_metadata as Record<string, unknown> | undefined

    const { data: profile } = await service
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    const { data: clientByAuth } = await service
      .from('client_accounts')
      .select('id, project_id, status')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    const { data: clientByEmail } = !clientByAuth && user.email
      ? await service
          .from('client_accounts')
          .select('id, project_id, status')
          .eq('email', user.email)
          .maybeSingle()
      : { data: null }

    const clientAccount = clientByAuth ?? clientByEmail

    if (isClientUser(profile?.role as string | undefined, metadata) || clientAccount) {
      if (!clientAccount) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=not_invited`,
        )
      }

      if (clientAccount.status === 'revoked') {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}${ROUTES.LOGIN}?error=access_revoked`,
        )
      }

      if (!clientByAuth || clientAccount.status === 'pending') {
        await service
          .from('client_accounts')
          .update({
            auth_user_id: user.id,
            ...(clientAccount.status === 'pending' ? { status: 'active' } : {}),
          })
          .eq('id', clientAccount.id)
      }

      return NextResponse.redirect(
        `${origin}/portal/${clientAccount.project_id}`,
      )
    }

    if (!profile) {
      await service.auth.admin.deleteUser(user.id)
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

    const hasInvitedRole = Boolean(metadata?.invited_role)
    const isAdmin = profile.role === 'admin'

    if (!isAdmin && !hasInvitedRole) {
      await service.from('profiles').delete().eq('id', user.id)
      await service.auth.admin.deleteUser(user.id)
      await supabase.auth.signOut()
      return NextResponse.redirect(
        `${origin}${ROUTES.LOGIN}?error=not_invited`,
      )
    }

    if (
      metadata?.invited_role &&
      metadata.invited_role !== 'client'
    ) {
      return NextResponse.redirect(`${origin}${ROUTES.ACCEPT_INVITE}`)
    }

    const redirectPath = next.startsWith('/') ? next : ROUTES.DASHBOARD
    return NextResponse.redirect(`${origin}${redirectPath}`)
  }

  return NextResponse.redirect(
    `${origin}${ROUTES.LOGIN}?error=auth_callback_failed`,
  )
}
