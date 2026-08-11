// Server-only — never import in client components or app/
export const ENV_SERVER = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
} as const
