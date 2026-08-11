import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { ENV } from '@/constants/env'

export function createClient() {
  return createBrowserClient<Database>(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY,
  )
}
