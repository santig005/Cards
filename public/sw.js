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
