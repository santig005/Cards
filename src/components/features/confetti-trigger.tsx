'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

function burst() {
  confetti({ particleCount: 70, spread: 55, angle: 60, origin: { x: 0, y: 0.65 } })
  confetti({ particleCount: 70, spread: 55, angle: 120, origin: { x: 1, y: 0.65 } })
}

/**
 * Fires a confetti burst on mount when `fire` is true.
 * Renders nothing — drop it anywhere in the tree.
 */
export function ConfettiTrigger({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return
    const id = setTimeout(burst, 350)
    return () => clearTimeout(id)
  }, [fire])

  return null
}

export { burst as fireConfetti }
