-- ============================================================================
-- Sellio · Google Wallet — pases de fidelización del cliente
-- ----------------------------------------------------------------------------
-- Contexto: ver feat/google-wallet.
--
-- Agrega la infraestructura de datos para los pases de Google Wallet:
--
--   * wallet_passes  Una fila por pase emitido para una loyalty_card del
--                    cliente final. `object_id` es el id del Loyalty Object en
--                    Google (issuerId.suffix) y `class_id` el de la Loyalty
--                    Class. `channel` distingue el wallet ('google'; futuro:
--                    'apple'). `status` permite revocar el pase sin borrar la
--                    fila ('active' | 'revoked').
--
-- Modelo de acceso:
--   * El CLIENTE FINAL (authenticated, vinculado vía customers.auth_user_id)
--     gestiona SOLO sus propios pases — política self FOR ALL abajo.
--   * El despacho/emisión real corre SERVER-SIDE con el rol `postgres`, que es
--     dueño de las tablas y BYPASSA RLS (no usamos FORCE RLS). Por eso NO se
--     necesita una política para el dueño del negocio aquí.
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run.
--   (o `psql "$DATABASE_URL_DIRECT" -f supabase/migrations/0006_wallet_passes.sql`)
--
-- Idempotente: se puede correr varias veces sin error (IF NOT EXISTS / drop policy).
-- ============================================================================

-- ─── Tabla wallet_passes ────────────────────────────────────────────────────
create table if not exists public.wallet_passes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,                 -- RLS anchor
  customer_id uuid not null,
  card_id     uuid not null,                 -- la loyalty_card que el pase refleja
  channel     text not null default 'google', -- 'google' (futuro: 'apple')
  object_id   text not null,                 -- id del Loyalty Object en Google (issuerId.suffix)
  class_id    text not null,                 -- id de la Loyalty Class en Google
  status      text not null default 'active', -- 'active' | 'revoked'
  created_at  timestamp not null default now(),
  updated_at  timestamp not null default now()
);

-- ─── Un pase por (card, channel) ────────────────────────────────────────────
create unique index if not exists uniq_wallet_passes_card_channel
  on public.wallet_passes (card_id, channel);

-- ─── Permisos base para el rol authenticated ────────────────────────────────
-- RLS filtra filas; los GRANT habilitan la operación a nivel tabla.
grant select, insert, update, delete on public.wallet_passes to authenticated;

-- ─── Habilitar RLS ──────────────────────────────────────────────────────────
alter table public.wallet_passes enable row level security;

-- ============================================================================
-- POLÍTICA self — el cliente gestiona SOLO sus propios pases
-- Mismo patrón de subselect que push_subs_self_all (0005): FOR ALL con
-- using + with check para cubrir insert/update/delete además de select.
-- ============================================================================
drop policy if exists wallet_passes_self_all on public.wallet_passes;
create policy wallet_passes_self_all on public.wallet_passes
  for all
  using (
    customer_id in (
      select id from public.customers where auth_user_id = (select auth.uid())
    )
  )
  with check (
    customer_id in (
      select id from public.customers where auth_user_id = (select auth.uid())
    )
  );

-- ─── Índices que sostienen las políticas y los lookups de despacho ──────────
create index if not exists idx_wallet_passes_customer_id on public.wallet_passes (customer_id);
create index if not exists idx_wallet_passes_tenant_id   on public.wallet_passes (tenant_id);
