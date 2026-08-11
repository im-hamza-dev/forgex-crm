export const ENV = {
  SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  APP_URL:           process.env.NEXT_PUBLIC_APP_URL!,
} as const
