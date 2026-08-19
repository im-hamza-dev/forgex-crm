import nodemailer from 'nodemailer'
import type { CreateNotificationInput, NotificationType } from '@/types/notifications'
import { createServiceClient } from '@/lib/supabase/service'
import { ENV_SERVER } from '@/constants/env.server'

const EMAIL_WORTHY_TYPES = new Set<NotificationType>([
  // Team notifications
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
  // Client notifications
  'client_doc_sent',
])

const ALWAYS_SEND_TYPES = new Set<NotificationType>([
  'client_doc_sent',
  'ticket_reply',
  'ticket_opened',
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
  if (!recipient?.email) {
    const { data: clientAccount } = await service
      .from('client_accounts')
      .select('email, full_name')
      .eq('auth_user_id', input.user_id)
      .single()

    if (!clientAccount?.email) return

    const html = buildEmailHtml({
      recipientName: clientAccount.full_name ?? 'Valued Client',
      title: input.title,
      body: input.body ?? '',
      actorName: input.actor_name,
      metadata: input.metadata ?? {},
      type: input.type,
    })

    await sendViaProvider({
      to: clientAccount.email,
      subject: input.title,
      html,
    })
    return
  }

  const lastActive = new Date(recipient.updated_at ?? 0)
  if (!ALWAYS_SEND_TYPES.has(input.type)) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (lastActive > twentyFourHoursAgo) return
  }

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
  const provider = ENV_SERVER.EMAIL_PROVIDER

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
    host: ENV_SERVER.BREVO_SMTP_HOST,
    port: Number(ENV_SERVER.BREVO_SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: ENV_SERVER.BREVO_SMTP_USER,
      pass: ENV_SERVER.BREVO_SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `Forgex Systems <${ENV_SERVER.EMAIL_FROM}>`,
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
  const apiKey = ENV_SERVER.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const from = `Forgex Systems <${ENV_SERVER.EMAIL_FROM}>`
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

export async function sendClientInviteEmail(input: {
  clientEmail: string
  clientName: string
  projectName: string
  company?: string | null
  inviteUrl: string
}): Promise<void> {
  const html = buildClientInviteHtml(input)
  await sendViaProvider({
    to: input.clientEmail,
    subject: `You've been invited to ${input.projectName} portal`,
    html,
  })
}

function buildClientInviteHtml(input: {
  clientName: string
  projectName: string
  company?: string | null
  inviteUrl: string
}): string {
  const firstName = input.clientName.split(' ')[0] ?? input.clientName

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0ece8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#9c6644;padding:20px 28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-weight:700;font-size:14px;">F</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-weight:700;font-size:17px;letter-spacing:-0.3px;">Forgex<span style="color:#f5ede6;">.systems</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px 28px 0;">
              <div style="width:48px;height:48px;background:#f5ede6;border-radius:12px;text-align:center;line-height:48px;font-size:22px;margin-bottom:20px;">🎉</div>
              <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1008;letter-spacing:-0.4px;line-height:1.2;">
                Welcome, ${firstName}!
              </h1>
              <p style="margin:0 0 20px;font-size:15px;color:#7a6555;line-height:1.6;">
                You've been invited to access your dedicated project portal.
              </p>

              <!-- Project card -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#faf8f6;border:1px solid #e8d5c4;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px;height:40px;background:#9c6644;border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;">
                          📋
                        </td>
                        <td style="padding-left:12px;vertical-align:middle;">
                          <p style="margin:0;font-size:11px;font-weight:600;color:#b0a090;text-transform:uppercase;letter-spacing:0.06em;">Your project</p>
                          <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:#1a1008;">${input.projectName}</p>
                          ${input.company ? `<p style="margin:2px 0 0;font-size:13px;color:#7a6555;">${input.company}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9c6644;text-transform:uppercase;letter-spacing:0.07em;">
                Your portal includes
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f5ede6;border-radius:6px;text-align:center;vertical-align:middle;font-size:14px;">📊</td>
                        <td style="padding-left:10px;font-size:14px;color:#3d2e1e;vertical-align:middle;">Real-time project progress and milestones</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f5ede6;border-radius:6px;text-align:center;vertical-align:middle;font-size:14px;">📢</td>
                        <td style="padding-left:10px;font-size:14px;color:#3d2e1e;vertical-align:middle;">Updates and announcements from the team</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f5ede6;border-radius:6px;text-align:center;vertical-align:middle;font-size:14px;">📁</td>
                        <td style="padding-left:10px;font-size:14px;color:#3d2e1e;vertical-align:middle;">Shared files and documents</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#f5ede6;border-radius:6px;text-align:center;vertical-align:middle;font-size:14px;">💬</td>
                        <td style="padding-left:10px;font-size:14px;color:#3d2e1e;vertical-align:middle;">Direct communication with the Forgex team</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 28px;">
              <div style="height:1px;background:#f0ece8;"></div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 28px;">
              <p style="margin:0 0 16px;font-size:14px;color:#7a6555;line-height:1.6;">
                Click below to set your password and access your portal.
                This link expires in <strong style="color:#1a1008;">24 hours</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#9c6644;border-radius:10px;text-align:center;">
                    <a href="${input.inviteUrl}"
                      style="display:block;padding:14px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;letter-spacing:-0.1px;">
                      Access my portal →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#fef7e6;border-radius:8px;">
                <tr>
                  <td style="padding:12px 14px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:14px;padding-right:8px;vertical-align:top;">⏱</td>
                        <td style="font-size:13px;color:#8b5e00;line-height:1.5;">
                          If you didn't expect this invitation, you can safely ignore this email.
                          Your account won't be created until you click the link.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf8f6;border-top:1px solid #f0ece8;padding:16px 28px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size:12px;color:#b0a090;">
                    Sent by <strong style="color:#7a6555;">Forgex Systems</strong>
                  </td>
                  <td style="text-align:right;">
                    <a href="mailto:hamza@forgex.systems" style="font-size:12px;color:#9c6644;text-decoration:none;">
                      hamza@forgex.systems
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
