# ADR-007: Service worker de la PWA con Serwist (sobre next-pwa)

**Fecha:** 2026-06-11
**Estado:** Aceptada

## Contexto

La PWA de Sellio tenía sólo el **manifest** (`src/app/manifest.ts`): la app era
"instalable" en teoría, pero sin service worker (SW) no había precache de assets
ni fallback offline real, y el "agregar a inicio" quedaba a medias. Falta el SW
para completar la experiencia tipo-app que promete el producto ("sin app nativa").

El reto es que Sellio es **multi-tenant** y el flujo del cliente final maneja
**sesiones** (OTP por WhatsApp) y **server actions sensibles** (login, canje de
sellos). Un SW mal configurado que cachee respuestas con datos de sesión podría
servir el estado de otro cliente/tenant: un riesgo de aislamiento. Por eso la
configuración debe ser **conservadora**: mejor no-cachear de más que servir datos
viejos.

## Opciones evaluadas

- **next-pwa**: el clásico para Next. **Sin mantenimiento activo** (último release
  hace años), no soporta oficialmente el App Router de Next 15/16 y arrastra
  Workbox vía una integración frágil. Riesgo de quedar bloqueados en una versión
  vieja de Next.
- **@serwist/next (Serwist)**: sucesor mantenido de next-pwa, mismo linaje
  (Workbox), pensado para el **App Router**. El SW se escribe en TypeScript
  (`src/app/sw.ts`) con estrategias tipadas y precache manifest inyectado en build.
  Activo y con releases frecuentes (v9.x).
- **SW a mano** (lo que había en `public/sw.js`): cero dependencias, pero sin
  precache versionado, sin expiración, y fácil de equivocar en multi-tenant. Más
  código propio que mantener para reimplementar lo que Workbox ya resuelve.

## Decisión

Se elige **@serwist/next** y se reemplaza el `public/sw.js` hecho a mano.

- **SW fuente:** `src/app/sw.ts` (TypeScript, tipado con `serwist`). Se compila a
  `public/sw.js` en build (gitignored; es artefacto generado).
- **Estrategias (conservadoras):**
  - **NetworkFirst** para navegación/documentos/RSC → online siempre va a la red;
    la caché es sólo fallback offline, nunca sirve estados de sesión viejos.
  - **CacheFirst / StaleWhileRevalidate** SÓLO para assets estáticos inmutables
    (`/_next/static` con hash de contenido, fuentes, imágenes).
  - **NetworkOnly** para `/api/*`, rutas de auth (`/login`, `/registro`, `/auth/*`)
    y **cualquier petición no-GET**. Las server actions de OTP/canje son POST y no
    pasan por estas estrategias; igual hay un **catch-all NetworkOnly** por defensa
    en profundidad.
- **Dev:** SW **deshabilitado** (`disable: NODE_ENV !== 'production'`) para no
  ensuciar el loop de desarrollo con cachés. El registro (`PwaRegister`) también se
  salta en dev.
- **Registro:** lo hace `src/components/features/pwa-register.tsx` (`register: false`
  en el plugin), montado en el layout del cliente.

### Build con webpack

`@serwist/next` es un plugin de **webpack**. Next 16 compila con **Turbopack** por
defecto, que **no ejecuta el plugin** (no se generaría el SW). El soporte Turbopack
de Serwist (`@serwist/turbopack`) está en *preview* con bugs conocidos de inyección
del `__SW_MANIFEST`. Por eso el script `build` usa **`next build --webpack`**: ruta
estable que garantiza que el SW se genere. Revisar cuando `@serwist/turbopack` sea
estable.

## Consecuencias

- La PWA queda completa: instalable + precache de assets + fallback offline básico.
- El build de producción usa webpack (algo más lento que Turbopack). Aceptable por
  ahora; migrable a `@serwist/turbopack` cuando madure.
- Agregar/quitar reglas de caché = editar `src/app/sw.ts`. Cualquier regla nueva
  debe respetar la regla de oro: **no cachear nada con sesión/tenant**.
- `public/sw.js` ya no se versiona (lo genera el build); se removió el SW manual.
