# 📍 Estado del proyecto — Sellio

> Documento de **handoff / estado actual**. Última actualización: **2026-06-15**.
> Resume qué está hecho, qué está pendiente y los pasos manuales para llegar a producción.
> Para el detalle de cada decisión técnica, ver `docs/adr/`.

---

## 1. Resumen ejecutivo

**Sellio** es un SaaS multi-tenant de fidelización digital (tarjeta de sellos) para LATAM.
El **MVP está completo y mergeado en `main`**, más varias features extra. Lo que falta para
operar con clientes reales **no es código, son pasos de infraestructura/cuentas** (ver §5).

Estado del código: **listo**. Estado de despliegue: **aún no desplegado en producción**.

---

## 2. Qué está hecho y mergeado en `main`

- **Auth de negocios** (Supabase Auth) + onboarding (nombre, logo, configurar tarjeta).
- **Multi-tenant con RLS** (aislamiento por `tenant_id`; helpers `withAuth` / `withTenantTx` / `requireTenant`).
- **Flujo del cliente**: QR → `/c/[slug]` → OTP por WhatsApp → tarjeta de sellos.
- **Panel del negocio**: registrar sellos (anti-fraude + cooldown + deshacer), canje manual, confeti,
  gestión de clientes (editar/borrar/CSV/detalle), dashboard con analytics.
- **Afiche QR imprimible**.
- **i18n completo** es / en / pt (next-intl, locale por cookie) + validaciones Zod y fechas por locale.
- **Multi-país** (ADR-007): país/timezone/locale por tenant, teléfono normalizado (`libphonenumber-js`),
  selector con banderas SVG, aviso Habeas Data por país.
- **PWA-lite instalable** (manifest + service worker propio, mantiene Turbopack — sin Serwist).
- **Web Push (ADR-009 etapa 1)** — backend **y** frontend mergeados (#22, #23). Probado end-to-end
  en localhost: suscripción → sello → notificación "Nuevo sello" / "Recompensa lista", con
  preferencias granulares (toggles) y re-oferta tras N visitas. **Falta solo configurar VAPID en Vercel.**
- **Dark mode**, tests Vitest + CI.

---

## 3. En revisión (PR abierto)

| PR | Rama | Qué es | Estado |
|----|------|--------|--------|
| **#24** | `feat/google-wallet` | **Google Wallet** (ADR-010): pase de fidelización + auto-update. Implementación **completa y NO-OP-safe** (no probada en vivo: falta crear el emisor). | Abierto, listo para merge. Revisado por agente: sin blockers. |

> #21 (refactor helpers), #22 (Web Push backend), #23 (Web Push frontend) ya están **mergeados**.

---

## 4. Migraciones de base de datos

Las migraciones SQL se aplican **a mano** en el SQL Editor de Supabase (no por drizzle-kit).

| Archivo | Estado |
|---------|--------|
| `0001_rls_policies.sql` … `0005_push_subscriptions.sql` | ✅ Aplicadas |
| `0006_wallet_passes.sql` | ⏳ **Pendiente** (aplicar al activar Google Wallet / mergear #24) |

---

## 5. Pendientes para llegar a producción (NO son código)

Ordenados por lo que realmente desbloquea usuarios reales:

### 5.1 Desplegar a Vercel  🔴 (lo más importante)
1. Conectar el repo a un proyecto de Vercel (deploy automático por push + preview por PR).
2. Configurar las **variables de entorno** (ver §6).
3. `NEXT_PUBLIC_APP_URL` debe apuntar al dominio definitivo (los QR y las notificaciones lo usan).

### 5.2 WhatsApp productivo (Twilio)  🔴 (gatea el onboarding de clientes)
Hoy el OTP del cliente corre **solo en el sandbox de Twilio**. En producción **ningún cliente real
podrá registrarse** hasta tener un **sender de WhatsApp aprobado** (número/template productivo).
Es un trámite con tiempo de espera y costo → **iniciarlo cuanto antes**.

### 5.3 Activar Google Wallet (opcional, cuando se decida)  🟡
1. Crear cuenta de **emisor** en la [Google Pay & Wallet console](https://pay.google.com/business/console) → anotar `issuerId`.
2. Habilitar la **Google Wallet API** en Google Cloud + crear una **service account** (descargar JSON).
3. Autorizar el email de la service account en la Wallet console.
4. Aplicar la migración `0006_wallet_passes.sql` en Supabase.
5. Setear las env `GOOGLE_WALLET_*` (ver §6) en `.env.local` y Vercel.
6. Para lanzamiento público: pasar de **demo mode** a **publishing access** desde el dashboard.
   > La Google Wallet API es **gratis** y sin restricción de país documentada (a diferencia de Apple).

---

## 6. Variables de entorno (referencia completa)

Documentadas en `.env.example`. En producción van en **Vercel**; en local en `.env.local` (nunca se commitea).

| Variable | Uso | ¿Listo? |
|----------|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | local ✅ / Vercel ⏳ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | local ✅ / Vercel ⏳ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (solo server) | local ✅ / Vercel ⏳ |
| `DATABASE_URL` | Drizzle (pooler :6543) | local ✅ / Vercel ⏳ |
| `DATABASE_URL_DIRECT` | Solo migraciones (:5432) | local ✅ |
| `NEXT_PUBLIC_APP_URL` | URL pública (QR, push, wallet) | ⏳ poner dominio prod |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push | local ✅ / Vercel ⏳ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push (cliente) | local ✅ / Vercel ⏳ |
| `GOOGLE_WALLET_ISSUER_ID` / `GOOGLE_WALLET_SA_EMAIL` / `GOOGLE_WALLET_SA_PRIVATE_KEY` | Google Wallet | ⏳ (al activar) |

> Sin las `VAPID_*` en Vercel, Web Push es NO-OP en producción.
> Sin las `GOOGLE_WALLET_*`, el pase de Wallet es NO-OP (botón oculto). Ninguna rompe el build.

---

## 7. Próximos pasos sugeridos (en orden)

1. **Mergear #24** (Google Wallet) — opcional, queda inerte hasta activarlo.
2. **Desplegar a Vercel** + configurar env vars → la app queda viva sobre HTTPS real.
3. **Iniciar el trámite de WhatsApp productivo** (en paralelo, tiene lead time).
4. Validar Web Push en un móvil real sobre el dominio de producción.
5. (Cuando haya señal de uso) activar **Google Wallet**.

---

## 8. Fase 2 / 3 — backlog futuro

- **Apple Wallet** (ADR-009 Q3): cuando el share iOS justifique el costo (US$99/año + cert).
- **Geofencing** del pase (ADR-010 Q5): requiere coordenadas por tenant.
- **Recordatorios de inactividad**: requieren un scheduler (Vercel Cron / función programada).
- **Billing con Stripe**: suscripción mensual del tenant (necesita ADR de planes).
- **Múltiples tipos de tarjeta**, **analytics avanzados**, **API pública POS**, **white-label**.
- Deuda menor: tests de integración de RLS (requieren Postgres real en CI; `tests/integration/` vacío).

---

## 9. Convenciones operativas (recordatorio)

- **Rama por feature → PR**. Nunca push directo a `main`.
- **pnpm** (no npm). Antes de PR: `tsc` + `eslint` + `pnpm test` + `pnpm build` en verde.
- Migraciones SQL: a mano en Supabase (idempotentes).
- Commits Conventional, en inglés. ADR para toda decisión de arquitectura no trivial.
- Notificaciones: abstracción de canales en `src/lib/notifications/` (`notifyCustomer` → fan-out).
  Agregar un canal (Apple Wallet, email…) = una entrada más en el array, sin tocar el dominio.

---

*Referencias: `docs/adr/ADR-009` (entrega de la tarjeta), `docs/adr/ADR-010` (Google Wallet),
`CLAUDE.md` / `AGENTS.md` (reglas del proyecto), `README.md` (setup).*
