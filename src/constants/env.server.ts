// Server-only — never import in client components or app/
export const ENV_SERVER = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? 'resend',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'noreply@forgex.systems',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL ?? 'hamza@forgex.systems',
  BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST,
  BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT,
  BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
  BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS,
} as const
