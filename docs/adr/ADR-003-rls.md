# ADR-003: Cómo se hace cumplir RLS (Row-Level Security) con Drizzle

**Fecha:** 2026-06-10
**Estado:** Aceptada

## Contexto

El `CLAUDE.md` declara la RLS como regla no negociable: la DB debe aislar los datos
por tenant aunque el código de la app olvide filtrar ("regla de oro"). Sin embargo,
la app accede a PostgreSQL con **Drizzle sobre el pooler de Supabase usando el rol
`postgres`**, que es **dueño de las tablas** y por lo tanto **bypassa RLS**. Es decir:
agregar políticas RLS, por sí solo, no protege nada en la ruta principal de la app —
las queries de Drizzle las ignorarían.

Había que decidir cómo lograr que RLS realmente se aplique.

## Opciones evaluadas

- **Opción A — RLS real (defensa en profundidad).** Cada query del negocio corre
  dentro de una transacción que baja privilegios a `SET LOCAL ROLE authenticated` y
  expone el usuario vía `request.jwt.claims`. Así `auth.uid()` funciona y las
  políticas se aplican de verdad.
  - ✅ Cumple la regla de oro; la DB es la última línea de defensa.
  - ✅ No requiere custom claims ni Auth Hooks (se ancla en `auth.uid()`).
  - ➖ Un poco más de plumbing: un wrapper `withAuth()` y envolver las queries.

- **Opción B — RLS como respaldo, Drizzle-service confía en el filtro de la app.**
  - ✅ Cero refactor.
  - ❌ RLS queda decorativa para el dashboard (no protege la ruta real). Contradice
    la regla de oro.

- **Opción C — Mover el acceso a datos a supabase-js / PostgREST.** Descartada: gran
  refactor y contradice ADR-002 (Drizzle como ORM).

## Decisión

Se elige la **Opción A**, anclando las políticas en `auth.uid()` mediante las
relaciones existentes (`tenants.owner_id`), **sin custom JWT claim**.

Implementación:
- `src/lib/drizzle/db.ts` → helper `withAuth(userId, fn)`: abre transacción, fija
  `request.jwt.claims` (con `sub = userId`), hace `SET LOCAL ROLE authenticated` y
  ejecuta las queries del callback bajo ese rol. `SET LOCAL` es seguro con el
  Transaction pooler (toda la transacción usa un único backend).
- `supabase/migrations/0001_rls_policies.sql` → habilita RLS en todas las tablas,
  otorga permisos a `authenticated` y crea políticas por tenant. **No** se usa
  `FORCE ROW LEVEL SECURITY` a propósito (ver abajo).

Todas las rutas del **negocio (dashboard)** pasaron a `withAuth`: layout, dashboard,
clientes (página + `addStamp`), QR y onboarding (página + `createProgram`).

## Rutas que intencionalmente corren como servicio (bypass RLS)

Por diseño, estas siguen usando el `db` directo (rol `postgres`, dueño → bypass).
Por eso **no** activamos `FORCE RLS`:

1. **Registro del negocio** (`(auth)/actions.ts`): bootstrap. Al crear el usuario
   todavía no hay sesión utilizable en la conexión; insertar el tenant como servicio
   es legítimo y acotado (`owner_id = data.user.id`).
2. **Flujo público del cliente** (`(customer)/c/[slug]/...`): hoy el cliente final no
   tiene autenticación (entra solo con su celular). Es un hueco conocido que se cierra
   en el **Paso 2 (OTP)**. Mitigación interina: rate limit de creación de clientes por
   tenant (ver `getOrCreateCard`).

## Rate limiting (mismo cambio)

- `addStamp`: cooldown de 3 s por tarjeta (anti-doble-tap / anti-fraude), a nivel DB.
- `getOrCreateCard`: tope de 30 clientes nuevos por tenant por minuto (anti-spam).

## Consecuencias

- El aislamiento multi-tenant del dashboard ya no depende solo del código: la DB lo
  garantiza. Si una query olvida el `where tenant_id`, RLS la corta igual.
- **Supuesto operativo:** el rol del pooler (`postgres.<ref>`) puede `SET ROLE
  authenticated` (en Supabase, `postgres` es miembro de `authenticated`). Verificar
  en un proyecto nuevo si las queries del dashboard empiezan a devolver vacío.
- **Pendiente Paso 2:** OTP del cliente + políticas para que el cliente vea solo su
  tarjeta (`customers.auth_user_id = auth.uid()`), y recién ahí evaluar `FORCE RLS`.
- La migración SQL se aplica manual (SQL Editor de Supabase o `psql`), porque el
  proyecto venía usando `db:push` y no un historial de migraciones de drizzle-kit.
