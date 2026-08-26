export type ParsedUserAgent = {
  browser: string | null
  os: string | null
  device: string | null
}

/**
 * Lightweight UA parse for the activity drawer. Not a full detector — just
 * enough to tell Chrome vs Safari and phone vs desktop.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) return { browser: null, os: null, device: null }

  let device: string = 'desktop'
  if (/bot|crawl|spider|slurp|facebookexternalhit|preview|whatsapp/i.test(ua)) {
    device = 'bot'
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = 'tablet'
  } else if (/mobi|iphone|ipod|android.+mobile/i.test(ua)) {
    device = 'mobile'
  }

  let os: string | null = null
  if (/windows nt/i.test(ua)) os = 'Windows'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/cros/i.test(ua)) os = 'Chrome OS'
  else if (/linux/i.test(ua)) os = 'Linux'

  let browser: string | null = null
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera'
  else if (/crios\//i.test(ua)) browser = 'Chrome'
  else if (/fxios\//i.test(ua)) browser = 'Firefox'
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome'
  else if (/firefox\//i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua))
    browser = 'Safari'
  else if (/msie|trident/i.test(ua)) browser = 'IE'

  return { browser, os, device }
}
