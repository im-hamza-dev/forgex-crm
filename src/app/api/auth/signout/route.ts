import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'
import { ENV } from '@/constants/env'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL(ROUTES.LOGIN, ENV.APP_URL), {
    status: 302,
  })
}
