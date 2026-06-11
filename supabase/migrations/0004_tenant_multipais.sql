-- ============================================================================
-- Sellio · Multi-país — país, zona horaria y locale por tenant
-- ----------------------------------------------------------------------------
-- Contexto: ver docs/adr/ADR-007-multipais.md
--
-- Migración ADITIVA: agrega tres columnas a `tenants` con defaults que preservan
-- el comportamiento actual (Colombia). NO modifica datos existentes: las filas
-- ya creadas adoptan los defaults automáticamente.
--
--   * country_code  ISO 3166-1 alpha-2 del negocio. Ancla la normalización de
--                   teléfono a E.164 (ver src/lib/loyalty.ts).
--   * timezone      Zona horaria IANA del negocio. Agrupa analytics por día local
--                   (ver src/app/(dashboard)/dashboard/page.tsx).
--   * locale        Idioma preferido del negocio (es | en | pt).
--
-- RLS: `tenants` ya tiene RLS habilitada (0001_rls_policies.sql). Agregar columnas
-- NO altera las políticas existentes ni el estado de RLS — se mantiene activa.
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run.
--   (o `psql "$DATABASE_URL_DIRECT" -f supabase/migrations/0004_tenant_multipais.sql`)
--
-- Idempotente: se puede correr varias veces sin error (IF NOT EXISTS).
-- ============================================================================

alter table public.tenants
  add column if not exists country_code char(2) not null default 'CO';

alter table public.tenants
  add column if not exists timezone text not null default 'America/Bogota';

alter table public.tenants
  add column if not exists locale text not null default 'es';

-- ─── Verificación: RLS sigue habilitada en tenants ──────────────────────────
-- (no-op si ya estaba; 0001 la habilitó). Cinturón y tirantes.
alter table public.tenants enable row level security;
