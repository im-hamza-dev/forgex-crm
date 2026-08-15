import nodemailer from 'nodemailer'
import type { CreateNotificationInput, NotificationType } from '@/types/notifications'
import { createServiceClient } from '@/lib/supabase/service'

const EMAIL_WORTHY_TYPES = new Set<NotificationType>([
  'task_assigned',
  'task_comment_added',
  'task_overdue',
  'lead_assigned',
  'project_member_added',
  'project_updated',
  'ticket_opened',
  'ticket_reply',
  'calendar_assigned',
  'team_member_joined',
  'milestone_completed',
])

type ProfileEmailRow = {
  email: string | null
  full_name: string | null
  updated_at: string | null
}

export async function sendNotificationEmail(
  input: CreateNotificationInput,
): Promise<void> {
  if (!EMAIL_WORTHY_TYPES.has(input.type)) return

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('email, full_name, updated_at')
    .eq('id', input.user_id)
    .single()

  const recipient = profile as ProfileEmailRow | null
  if (!recipient?.email) return

  const lastActive = new Date(recipient.updated_at ?? 0)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  if (lastActive > fiveMinutesAgo) return

  const html = buildEmailHtml({
    recipientName: recipient.full_name ?? 'Team Member',
    title: input.title,
    body: input.body ?? '',
    actorName: input.actor_name ?? undefined,
    metadata: input.metadata ?? {},
    type: input.type,
  })

  await sendViaProvider({
    to: recipient.email,
    subject: input.title,
    html,
  })

  let latestQuery = service
    .from('notifications' as never)
    .select('id')
    .eq('user_id', input.user_id)
    .eq('type', input.type)
    .order('created_at', { ascending: false })
    .limit(1)

  if (input.reference_id) {
    latestQuery = latestQuery.eq('reference_id', input.reference_id)
  }

  const { data: latest } = await latestQuery.maybeSingle()
  const latestId = (latest as { id?: string } | null)?.id
  if (!latestId) return

  await service
    .from('notifications' as never)
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
    } as never)
    .eq('id', latestId)
}

async function sendViaProvider(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? 'brevo'

  if (provider === 'resend') {
    await sendViaResend(opts)
  } else {
    await sendViaBrevo(opts)
  }
}

async function sendViaBrevo(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST ?? 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `Forgex CRM <${process.env.EMAIL_FROM ?? 'noreply@forgex.system'}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
}

async function sendViaResend(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const from = `Forgex CRM <${process.env.EMAIL_FROM ?? 'noreply@forgex.system'}>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend failed: ${res.status} ${text}`)
  }
}

function buildEmailHtml(opts: {
  recipientName: string
  title: string
  body: string
  actorName?: string
  metadata: Record<string, unknown>
  type: string
}): string {
  const accentColor = '#8B5E3C'
  void opts.metadata
  void opts.type

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${accentColor};padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
                Forgex CRM
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600;">
                Hi ${opts.recipientName},
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                ${opts.body || opts.title}
              </p>
              ${
                opts.actorName
                  ? `
              <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
                From: <strong style="color:#374151;">${opts.actorName}</strong>
              </p>`
                  : ''
              }
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.forgex.system'}"
                style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
                Open Forgex CRM
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you have notifications enabled in Forgex CRM.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
