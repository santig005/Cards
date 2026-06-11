import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          borderRadius: '36px',
          fontSize: '110px',
          fontWeight: 900,
          color: '#1c1917',
          letterSpacing: '-4px',
        }}
      >
        S
      </div>
    ),
    { ...size }
  )
}
