import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { ENV } from '@/constants/env'
import { ENV_SERVER } from '@/constants/env.server'

// RLS bypass — only for: portal invite, notification fan-out, cron
export function createServiceClient() {
  return createClient<Database>(
    ENV.SUPABASE_URL,
    ENV_SERVER.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
