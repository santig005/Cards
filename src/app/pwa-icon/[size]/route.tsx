import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const VALID = new Set(['192', '512'])

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  if (!VALID.has(size)) return new Response('Not found', { status: 404 })

  const px = Number(size)
  const radius = Math.round(px * 0.2)
  const fontSize = Math.round(px * 0.6)

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: radius,
          fontSize,
          fontWeight: 900,
          color: '#1c1917',
          letterSpacing: '-2px',
        }}
      >
        S
      </div>
    ),
    { width: px, height: px }
  )
}
