import type { PostgrestError } from '@supabase/supabase-js'
import { SupabaseError } from './errors'

export function throwIfError(error: PostgrestError | null): void {
  if (error) throw new SupabaseError(error.message)
}
