import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sellio — Tarjeta de Fidelización',
    short_name: 'Sellio',
    description: 'Tu tarjeta de sellos digital. Acumulá premios sin tarjeta física.',
    start_url: '/c',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1c1917',
    theme_color: '#f59e0b',
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
