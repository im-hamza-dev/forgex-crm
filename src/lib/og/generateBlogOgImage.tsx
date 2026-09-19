import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load fonts synchronously at module level
const fontBold = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Bold.ttf'),
)
const fontRegular = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Regular.ttf'),
)
const fontSemibold = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Semibold.ttf'),
)

// Brand constants — Forgex design system
const CREAM = '#ffffe3'
const INK = '#10100e'
const INK_40 = 'rgba(16, 16, 14, 0.4)'

function getFontSize(title: string): number {
  if (title.length <= 50) return 56
  if (title.length <= 70) return 44
  return 36
}

function truncateTitle(title: string): string {
  if (title.length <= 80) return title
  return title.slice(0, 77) + '...'
}

export async function generateBlogOgImage(title: string): Promise<Buffer> {
  const displayTitle = truncateTitle(title)
  const fontSize = getFontSize(displayTitle)

  const response = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: CREAM,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          fontFamily: 'GeneralSans',
        }}
      >
        {/* Left accent bar — ink vertical stripe full height */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: 630,
            backgroundColor: INK,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '80px 80px 80px 100px',
            width: 1200,
            height: 630,
          }}
        >
          {/* Top — domain label, matches nav logo ink-40 treatment */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: INK_40,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            forgex.systems
          </div>

          {/* Center — post title, matches blog h1 */}
          <div
            style={{
              fontSize: fontSize,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              maxWidth: 900,
              wordBreak: 'break-word',
            }}
          >
            {displayTitle}
          </div>

          {/* Bottom — section label pattern */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: INK_40,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Forgex Systems
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'GeneralSans',
          data: fontRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'GeneralSans',
          data: fontSemibold,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'GeneralSans',
          data: fontBold,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  )

  // Convert ImageResponse to Buffer for Supabase upload
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
