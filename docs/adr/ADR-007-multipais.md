# ADR-007: Multi-país por tenant (país, timezone y locale)

**Fecha:** 2026-06-11
**Estado:** Aceptada (bases backend)

## Contexto

El MVP asumía **Colombia** en dos puntos del backend:

1. **Normalización de teléfono** — `normalizePhoneToE164` anteponía `+57`
   hardcodeado a cualquier número sin `+`. Para un negocio mexicano, un móvil
   local de 10 dígitos (`5512345678`) terminaba como `+575512345678`: un número
   colombiano inválido que rompía el OTP de Supabase.
2. **Analytics** — el agrupamiento de sellos por día usaba `America/Bogota`
   hardcodeado, así que un negocio en otra zona horaria veía los días corridos.

Sellio apunta a LATAM (ver `CLAUDE.md` Fase 3 y `docs/lista-de-deseos.md`), por
lo que el país, la zona horaria y el idioma deben ser **por negocio (tenant)**.

Ya existe en `main` el dataset `src/lib/countries` (ISO 3166-1, `dialCode` E.164,
`defaultTimezone` IANA) y `libphonenumber-js` como dependencia; esta ADR los
aprovecha en lugar de duplicar datos.

## Opciones evaluadas

- **A. País/timezone/locale por tenant (columnas en `tenants`).**
  Pros: aislamiento natural multi-tenant; un solo lugar de verdad; defaults
  preservan el comportamiento actual. Contras: requiere migración aditiva.
- **B. Detectar país desde el teléfono que escribe el cliente.**
  Pros: sin migración. Contras: el cliente suele escribir el número local sin
  `+`, así que no hay señal de país fiable; no resuelve la timezone de analytics.
- **C. Variable global de despliegue (env).** Pros: simple. Contras: no soporta
  varios países en un mismo despliegue — rompe el modelo multi-tenant.

## Decisión

Se elige **A**. Tres columnas nuevas en `tenants`, con defaults que conservan el
comportamiento histórico (Colombia):

| Columna | Tipo | Default | Uso |
|---|---|---|---|
| `country_code` | `char(2)` NOT NULL | `'CO'` | ISO 3166-1 alpha-2; ancla la normalización de teléfono a E.164 |
| `timezone` | `text` NOT NULL | `'America/Bogota'` | IANA; agrupa analytics por día local |
| `locale` | `text` NOT NULL | `'es'` | idioma del negocio (es \| en \| pt) |

### Teléfono
`normalizePhoneToE164(raw, countryCode = 'CO')` ahora usa
`libphonenumber-js`: parsea con el país del negocio y devuelve E.164 validado
(`isValid()`). Si el usuario escribe el `+` con su indicativo, se respeta ese
país. Se mantiene **E.164 como formato almacenado** (lo exige Supabase Auth).
La constante exportada `DEFAULT_COUNTRY_CODE` pasa de `'+57'` a `'CO'` (ISO),
alineada con el default de la columna.

### Analytics
`dashboard/page.tsx` usa `tenant.timezone` en vez de `America/Bogota`, y pasa
`tenant.locale` a `buildLast7Days` para localizar el label del día. La página de
detalle de cliente usa `tenant.timezone`/`tenant.locale` en su `DateTimeFormat`.
`buildLast7Days` gana un parámetro opcional `locale` (sin él, mantiene los labels
en español por defecto: backward compatible).

## Migración

`supabase/migrations/0004_tenant_multipais.sql` — **aditiva e idempotente**
(`add column if not exists`). Siguiendo el patrón del repo (ver README), las
migraciones SQL se aplican **a mano** en el **SQL Editor de Supabase** (o con
`psql "$DATABASE_URL_DIRECT" -f ...`), no por Drizzle. El schema Drizzle
(`src/lib/drizzle/schema.ts`) se actualizó en paralelo para mantener el tipado.

**RLS:** `tenants` ya tenía RLS habilitada (`0001`); agregar columnas no la
altera. La migración reafirma `enable row level security` por seguridad.

## Consecuencias

- Los tenants existentes adoptan `CO / America/Bogota / es` automáticamente: el
  comportamiento actual no cambia hasta que un negocio configure otro país.
- El **selector de país en el onboarding** y los **textos legales por país**
  (Habeas Data) van en un PR aparte (solo frontend/contenido); esta ADR cubre
  únicamente las bases de backend.
- `vitest.config.ts` ganó el alias `@ → src` para que el código de dominio que
  importa `@/lib/countries` sea testeable.
- Agregar soporte para un país nuevo no requiere código: basta con setear las
  tres columnas del tenant (el dataset de países ya cubre todos los ISO 3166-1).
