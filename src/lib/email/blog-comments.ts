import type { SupabaseClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { ENV_SERVER } from '@/constants/env.server'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendViaProvider(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const provider = ENV_SERVER.EMAIL_PROVIDER

  if (provider === 'resend') {
    const apiKey = ENV_SERVER.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Forgex Systems <${ENV_SERVER.EMAIL_FROM}>`,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend failed: ${res.status} ${text}`)
    }
    return
  }

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

function buildPublicSiteEmail(opts: {
  recipientName: string
  headline: string
  bodyHtml: string
  ctaLabel: string
  ctaUrl: string
}): string {
  const name = escapeHtml(opts.recipientName)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#ffffe3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffe3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e4d8;">
          <tr>
            <td style="background:#10100e;padding:22px 28px;">
              <p style="margin:0;color:#ffffe3;font-size:18px;font-weight:700;letter-spacing:-0.3px;">
                Forgex<span style="opacity:0.45;font-weight:500;">.systems</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 8px;color:#10100e;font-size:16px;font-weight:600;">
                Hi ${name},
              </p>
              <p style="margin:0 0 20px;color:#10100e;font-size:15px;line-height:1.65;">
                ${opts.headline}
              </p>
              ${opts.bodyHtml}
              <a href="${opts.ctaUrl}"
                style="display:inline-block;margin-top:8px;background:#10100e;color:#ffffe3;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;">
                ${escapeHtml(opts.ctaLabel)}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #f0ece0;">
              <p style="margin:0;color:#8a8678;font-size:12px;">
                Sent by Forgex Systems
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

export async function shouldSendNotification(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('blog_comments')
    .select('*', { count: 'exact', head: true })
    .eq('author_email', email)
    .not('notification_sent_at', 'is', null)
    .gt('notification_sent_at', oneDayAgo)

  return (count ?? 0) === 0
}

export async function markNotificationSent(
  supabase: SupabaseClient,
  commentId: string,
): Promise<void> {
  await supabase
    .from('blog_comments')
    .update({ notification_sent_at: new Date().toISOString() })
    .eq('id', commentId)
}

export async function sendCommentApprovedEmail(input: {
  email: string
  authorName: string
  postTitle: string
  postSlug: string
}): Promise<void> {
  const postUrl = `https://www.forgex.systems/blog/${input.postSlug}`
  const html = buildPublicSiteEmail({
    recipientName: input.authorName,
    headline: `Your comment on &ldquo;${escapeHtml(input.postTitle)}&rdquo; is now live.`,
    bodyHtml: '',
    ctaLabel: 'View your comment →',
    ctaUrl: postUrl,
  })

  await sendViaProvider({
    to: input.email,
    subject: 'Your comment is live on Forgex',
    html,
  })
}

export async function sendCommentReplyEmail(input: {
  email: string
  authorName: string
  postTitle: string
  postSlug: string
  replyContent: string
}): Promise<void> {
  const postUrl = `https://www.forgex.systems/blog/${input.postSlug}`
  const quoted = escapeHtml(input.replyContent).replace(/\n/g, '<br/>')
  const html = buildPublicSiteEmail({
    recipientName: input.authorName,
    headline: `Hamza replied to your comment on &ldquo;${escapeHtml(input.postTitle)}&rdquo;:`,
    bodyHtml: `
      <blockquote style="margin:0 0 24px;padding:14px 16px;border-left:3px solid #10100e;background:#ffffe3;color:#10100e;font-size:14px;line-height:1.6;">
        ${quoted}
      </blockquote>
    `,
    ctaLabel: 'View the conversation →',
    ctaUrl: postUrl,
  })

  await sendViaProvider({
    to: input.email,
    subject: 'Hamza replied to your comment on Forgex',
    html,
  })
}
