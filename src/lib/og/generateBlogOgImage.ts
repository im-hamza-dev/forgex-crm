import satori from 'satori'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load fonts once at module level — not inside the function
// Paths relative to CRM root
const fontBold = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Bold.ttf'),
)
const fontRegular = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Regular.ttf'),
)
const fontSemibold = readFileSync(
  join(process.cwd(), 'src/assets/fonts/GeneralSans-Semibold.ttf'),
)

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

  // Brand constants — Forgex design system
  const CREAM = '#ffffe3'
  const INK = '#10100e'
  const INK_40 = 'rgba(16, 16, 14, 0.4)'
  const WIDTH = 1200
  const HEIGHT = 630
  const PADDING = 80
  const ACCENT_BAR_WIDTH = 6

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: WIDTH,
          height: HEIGHT,
          backgroundColor: CREAM,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          fontFamily: 'GeneralSans',
        },
        children: [
          // Left accent bar — ink vertical stripe, full height
          // Signature border pattern from Forgex design system
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: 0,
                top: 0,
                width: ACCENT_BAR_WIDTH,
                height: HEIGHT,
                backgroundColor: INK,
              },
            },
          },
          // Main content area
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: `${PADDING}px ${PADDING}px ${PADDING}px ${PADDING + ACCENT_BAR_WIDTH + 14}px`,
                width: WIDTH,
                height: HEIGHT,
              },
              children: [
                // Top — domain label
                // Matches nav logo treatment: domain in ink-40
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                      fontWeight: 400,
                      color: INK_40,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                    },
                    children: 'forgex.systems',
                  },
                },
                // Center — post title
                // Matches blog h1: font-black, tight tracking, ink
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: fontSize,
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.1,
                      maxWidth: 900,
                      wordBreak: 'break-word',
                    },
                    children: displayTitle,
                  },
                },
                // Bottom — section label
                // Matches SectionLabel pattern: 12px uppercase tracking-[0.1em]
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 12,
                      fontWeight: 600,
                      color: INK_40,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    },
                    children: 'Forgex Systems',
                  },
                },
              ],
            },
          },
        ],
      },
    // satori accepts a VNode object tree; React types don't model this shape
    } as never,
    {
      width: WIDTH,
      height: HEIGHT,
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

  // Convert SVG to PNG buffer via sharp
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  return png
}
