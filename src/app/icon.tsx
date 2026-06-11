import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: '8px',
          fontSize: '20px',
          fontWeight: 900,
          color: '#1c1917',
          letterSpacing: '-1px',
        }}
      >
        S
      </div>
    ),
    { ...size }
  )
}
