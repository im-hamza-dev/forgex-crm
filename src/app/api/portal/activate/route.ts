import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = createServiceClient()

    // Verify this is a client role
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'client') {
      return NextResponse.json({ error: 'Not a client account' }, { status: 403 })
    }

    // Activate the client account using service role (bypasses RLS)
    const { data: account, error } = await service
      .from('client_accounts')
      .update({ status: 'active' })
      .eq('auth_user_id', user.id)
      .eq('status', 'pending')
      .select('project_id')
      .maybeSingle()

    if (error) {
      // Already active — look up project_id
      const { data: existing } = await service
        .from('client_accounts')
        .select('project_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        project_id: existing?.project_id ?? null,
      })
    }

    if (!account) {
      const { data: existing } = await service
        .from('client_accounts')
        .select('project_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        project_id: existing?.project_id ?? null,
      })
    }

    return NextResponse.json({
      success: true,
      project_id: account.project_id ?? null,
    })
  } catch (err) {
    console.error('[portal/activate]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
