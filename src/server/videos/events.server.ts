import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { NotFoundError, SupabaseError, ValidationError } from '@/server/shared/errors'
import { parseUserAgent } from '@/lib/videos/user-agent'
import type { VideoEventType } from '@/types/videos'

const GEO_TIMEOUT_MS = 2000
const REFERRER_MAX = 2000
const UA_MAX = 1000

function decodeHeader(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

function firstForwardedIp(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  if (!first) return null
  // Strip :port from IPv4 "1.2.3.4:12345". Leave IPv6 alone.
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(first)) {
    return first.slice(0, first.lastIndexOf(':'))
  }
  return first
}

function isPublicIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return false
  if (ip.startsWith('10.')) return false
  if (ip.startsWith('192.168.')) return false
  if (ip.startsWith('127.')) return false
  if (ip.startsWith('172.')) {
    const second = Number(ip.split('.')[1])
    if (second >= 16 && second <= 31) return false
  }
  return true
}

async function lookupGeo(
  ip: string | null,
  headerCountry: string | null,
  headerCity: string | null,
): Promise<{ country: string | null; city: string | null }> {
  if (headerCountry || headerCity) {
    return { country: headerCountry, city: headerCity }
  }
  if (!ip || !isPublicIp(ip)) return { country: null, city: null }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`,
      { signal: AbortSignal.timeout(GEO_TIMEOUT_MS) },
    )
    if (!res.ok) return { country: null, city: null }
    const body = (await res.json()) as {
      status?: string
      country?: string
      city?: string
    }
    if (body.status !== 'success') return { country: null, city: null }
    return {
      country: body.country || null,
      city: body.city || null,
    }
  } catch {
    return { country: null, city: null }
  }
}

/**
 * Records a public view or play. Uses the service role so the visitor never
 * talks to the video_events table directly. Missing/private/deleted slugs 404
 * the same way the share page does.
 */
export async function recordPublicVideoEvent(
  slug: string,
  type: VideoEventType,
  referrer?: string | null,
): Promise<void> {
  if (type !== 'view' && type !== 'play') {
    throw new ValidationError('Invalid event type')
  }

  const service = createServiceClient()

  const { data: video, error: findError } = await service
    .from('videos')
    .select('id')
    .eq('slug', slug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) throw new SupabaseError(findError.message)
  if (!video) throw new NotFoundError('Video not found')

  const headerList = await headers()
  const ip =
    firstForwardedIp(headerList.get('x-forwarded-for')) ??
    headerList.get('x-real-ip') ??
    headerList.get('cf-connecting-ip')

  const userAgent = headerList.get('user-agent')
  const parsed = parseUserAgent(userAgent)

  const headerCountry = decodeHeader(
    headerList.get('x-vercel-ip-country') ?? headerList.get('cf-ipcountry'),
  )
  const headerCity = decodeHeader(headerList.get('x-vercel-ip-city'))

  const geo = await lookupGeo(ip, headerCountry, headerCity)

  const trimmedReferrer = referrer?.trim()
    ? referrer.trim().slice(0, REFERRER_MAX)
    : null

  const { error } = await service.rpc('record_video_event', {
    p_video_id: video.id,
    p_event_type: type,
    p_ip: ip ?? undefined,
    p_user_agent: userAgent ? userAgent.slice(0, UA_MAX) : undefined,
    p_referrer: trimmedReferrer ?? undefined,
    p_browser: parsed.browser ?? undefined,
    p_os: parsed.os ?? undefined,
    p_device: parsed.device ?? undefined,
    p_country: geo.country ?? undefined,
    p_city: geo.city ?? undefined,
  })

  if (error) throw new SupabaseError(error.message)
}
