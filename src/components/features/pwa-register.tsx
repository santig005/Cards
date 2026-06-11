'use client'

import { useEffect } from 'react'

// Registra el service worker generado por @serwist/next (`/sw.js`).
// Sólo en producción: en dev el SW está deshabilitado (no se emite el archivo).
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration is best-effort — never break the UI if it fails
      })
    }
  }, [])
  return null
}
