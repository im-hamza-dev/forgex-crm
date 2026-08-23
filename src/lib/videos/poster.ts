// The brand accent is inlined as a literal here, unlike everywhere else in the
// app, because an SVG inside a data URI has no access to the document's CSS
// custom properties. --color-accent in src/styles/forgex-brand.css remains the
// source of truth; keep these two in sync.
const ACCENT = '#9c6644'
const ACCENT_DEEP = '#7a4f34'
const INK = '#FFFFFF'
const INK_SOFT = '#F0E2D6'

const WIDTH = 1280
const HEIGHT = 720

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Greedy wrap on word boundaries, since SVG has no text flow. */
function wrap(text: string, charsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= charsPerLine) {
      current = candidate
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)

  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[maxLines - 1]!
    lines[maxLines - 1] = `${last.slice(0, Math.max(0, charsPerLine - 1))}…`
  }

  return lines
}

/**
 * Builds a text-only poster for the <video> element as an inline SVG data URI.
 * No image is captured or stored anywhere — this is generated per render.
 */
export function buildPosterDataUri(
  title: string,
  description?: string | null,
): string {
  const titleLines = wrap(title.trim() || 'Untitled', 34, 3)
  const descLines = description?.trim()
    ? wrap(description.trim(), 58, 2)
    : []

  const titleStart = descLines.length ? 300 : 350
  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="80" y="${titleStart + i * 76}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  const descStart = titleStart + titleLines.length * 76 + 34
  const descTspans = descLines
    .map(
      (line, i) =>
        `<tspan x="80" y="${descStart + i * 42}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACCENT}"/><stop offset="1" stop-color="${ACCENT_DEEP}"/></linearGradient></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
<circle cx="1120" cy="150" r="220" fill="${INK}" opacity="0.06"/>
<circle cx="180" cy="640" r="160" fill="${INK}" opacity="0.05"/>
<text x="80" y="140" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="26" font-weight="600" letter-spacing="4" fill="${INK_SOFT}" opacity="0.85">FORGEX SYSTEMS</text>
<text font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="${INK}">${titleTspans}</text>
${descLines.length ? `<text font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="32" font-weight="400" fill="${INK_SOFT}">${descTspans}</text>` : ''}
<g transform="translate(80 ${HEIGHT - 130})"><circle cx="34" cy="34" r="34" fill="${INK}" opacity="0.92"/><path d="M26 20 L52 34 L26 48 Z" fill="${ACCENT}"/></g>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
