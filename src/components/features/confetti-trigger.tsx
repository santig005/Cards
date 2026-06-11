'use client'

import { useEffect } from 'react'

const COLORS = ['#f59e0b', '#fbbf24', '#10b981', '#34d399', '#6366f1', '#f472b6', '#ef4444', '#60a5fa']

function createParticle(fromLeft: boolean) {
  const el = document.createElement('div')
  const size = Math.random() * 9 + 5
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]

  // Start from left or right edge, mid-height
  const startX = fromLeft ? -10 : window.innerWidth + 10
  const startY = window.innerHeight * (0.4 + Math.random() * 0.2)

  // Shoot inward + upward, then fall with gravity
  const angle = fromLeft
    ? -Math.PI * (0.1 + Math.random() * 0.35)   // shoot right-upward
    : -Math.PI * (0.65 + Math.random() * 0.35)  // shoot left-upward
  const speed = 12 + Math.random() * 10
  let vx = Math.cos(angle) * speed
  let vy = Math.sin(angle) * speed

  const isCircle = Math.random() > 0.4
  el.style.cssText = `
    position:fixed;
    width:${size}px;
    height:${size * (isCircle ? 1 : 0.5 + Math.random())}px;
    background:${color};
    left:${startX}px;
    top:${startY}px;
    border-radius:${isCircle ? '50%' : '2px'};
    pointer-events:none;
    z-index:9999;
    will-change:transform,opacity;
  `
  document.body.appendChild(el)

  let x = startX
  let y = startY
  let r = Math.random() * 360
  const rv = (Math.random() - 0.5) * 18
  let opacity = 1
  let frame = 0

  const tick = () => {
    frame++
    vy += 0.35       // gravity
    vx *= 0.99       // slight air resistance
    x += vx
    y += vy
    r += rv
    opacity = Math.max(0, 1 - frame / 90)

    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.transform = `rotate(${r}deg)`
    el.style.opacity = String(opacity)

    if (opacity > 0 && y < window.innerHeight + 60) {
      requestAnimationFrame(tick)
    } else {
      el.remove()
    }
  }
  requestAnimationFrame(tick)
}

export function fireConfetti() {
  const n = 65
  for (let i = 0; i < n; i++) {
    setTimeout(() => createParticle(true), Math.random() * 150)
    setTimeout(() => createParticle(false), Math.random() * 150)
  }
}

/**
 * Fires a confetti burst on mount when `fire` is true.
 * Renders nothing — drop it anywhere in the tree.
 */
export function ConfettiTrigger({ fire }: { fire: boolean }) {
  useEffect(() => {
    if (!fire) return
    const id = setTimeout(fireConfetti, 350)
    return () => clearTimeout(id)
  }, [fire])

  return null
}
