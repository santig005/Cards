// Sellio Service Worker
// Caches Next.js static assets (immutable) and provides offline fallback for navigation.
const STATIC = 'sellio-static-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // Cache-first for Next.js static chunks (content-hashed → truly immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.open(STATIC).then((cache) =>
        cache.match(e.request).then(
          (hit) =>
            hit ??
            fetch(e.request).then((res) => {
              cache.put(e.request, res.clone())
              return res
            })
        )
      )
    )
  }
  // All other requests: network only (RSC pages have dynamic data)
})

// ─── Web Push: recepción de notificaciones ────────────────────────────────────

self.addEventListener('push', (event) => {
  // Parsear el payload enviado por el servidor; caer a texto plano si falla
  let title = 'Sellio'
  let body = ''
  let url = '/'

  try {
    const data = event.data.json()
    title = data.title ?? title
    body = data.body ?? body
    url = data.url ?? url
  } catch {
    // Si el payload no es JSON válido, usar el texto crudo como cuerpo
    body = event.data ? event.data.text() : ''
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-icon/192',
      badge: '/pwa-icon/192',
      data: { url },
    })
  )
})

// ─── Web Push: clic en la notificación ───────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/'

  event.waitUntil(
    // Intentar enfocar una pestaña existente con esa URL; si no, abrir una nueva
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        return self.clients.openWindow(targetUrl)
      })
  )
})
