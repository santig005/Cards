'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration is best-effort — never break the UI if it fails
      })
    }
  }, [])
  return null
}
