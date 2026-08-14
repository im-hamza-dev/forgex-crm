import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { ENV } from '@/constants/env'

let browserClient: SupabaseClient<Database> | undefined

export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient<Database>(
    ENV.SUPABASE_URL,
    ENV.SUPABASE_ANON_KEY,
  )
  return browserClient
}
