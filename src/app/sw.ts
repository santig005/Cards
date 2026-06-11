/// <reference lib="webworker" />
//
// Service worker de Sellio (generado por @serwist/next a `public/sw.js`).
//
// Filosofía: CONSERVADOR. Sellio es multi-tenant y maneja sesiones de cliente
// final (OTP por WhatsApp) y server actions sensibles (login, canje de sellos).
// Servir una respuesta cacheada de otro estado de sesión sería un riesgo de
// aislamiento. Por eso:
//   - Navegación / documentos / RSC  -> NetworkFirst (cacheado SOLO como fallback
//     offline; online siempre va a la red, nunca sirve datos viejos).
//   - Assets estáticos inmutables (`/_next/static`, fuentes, imágenes) -> Cache/
//     StaleWhileRevalidate (tienen hash de contenido o son públicos).
//   - TODO lo demás (`/api/*`, auth, no-GET, cross-origin) -> NetworkOnly.
//
// Nota: Serwist sólo intercepta peticiones GET de navegación/recursos; los POST
// (server actions de OTP y canje) nunca pasan por estas estrategias, pero igual
// dejamos un catch-all NetworkOnly por defensa en profundidad.

import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RuntimeCaching,
  type SerwistGlobalConfig,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Manifest de precache inyectado por @serwist/next en build.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const ONE_DAY = 24 * 60 * 60;
const ONE_YEAR = 365 * ONE_DAY;

const runtimeCaching: RuntimeCaching[] = [
  // --- NUNCA cachear: API, rutas de auth, y cualquier no-GET ----------------
  // (server actions de OTP/canje y endpoints de auth quedan siempre en red)
  {
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      (pathname.startsWith("/auth/") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/registro")),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request }) => request.method !== "GET",
    handler: new NetworkOnly(),
  },

  // --- Assets estáticos inmutables (seguro cachear) -------------------------
  {
    // Chunks de Next con hash de contenido -> verdaderamente inmutables.
    matcher: ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [
        new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: ONE_YEAR }),
      ],
    }),
  },
  {
    matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i,
    handler: new CacheFirst({
      cacheName: "static-fonts",
      plugins: [
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: ONE_YEAR }),
      ],
    }),
  },
  {
    matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
    handler: new StaleWhileRevalidate({
      cacheName: "static-images",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * ONE_DAY }),
      ],
    }),
  },

  // --- Navegación / documentos / RSC -> NetworkFirst (fallback offline) -----
  {
    matcher: ({ request, url: { pathname }, sameOrigin }) =>
      sameOrigin &&
      !pathname.startsWith("/api/") &&
      (request.mode === "navigate" || request.headers.get("RSC") === "1"),
    handler: new NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 10,
      plugins: [
        new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY }),
      ],
    }),
  },

  // --- Catch-all: por defecto NO cachear ------------------------------------
  {
    matcher: () => true,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
