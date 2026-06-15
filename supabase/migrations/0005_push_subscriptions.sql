-- ============================================================================
-- Sellio · Web Push — suscripciones del navegador y preferencias del cliente
-- ----------------------------------------------------------------------------
-- Contexto: ver feat/web-push.
--
-- Agrega la infraestructura de datos para notificaciones Web Push:
--
--   * push_subscriptions  Una fila por suscripción de navegador del cliente
--                         final. `endpoint` es la URL del push endpoint (única
--                         globalmente). p256dh + auth son las claves que el
--                         servidor usa para cifrar el payload.
--   * customers.notify_*  Preferencias granulares: avisar cuando la recompensa
--                         está lista (notify_reward) y cuando suma un sello
--                         (notify_new_stamp). Default true (opt-out).
--
-- Modelo de acceso:
--   * El CLIENTE FINAL (authenticated, vinculado vía customers.auth_user_id)
--     gestiona SOLO sus propias suscripciones — política self FOR ALL abajo.
--   * El despacho de notificaciones corre SERVER-SIDE con el rol `postgres`,
--     que es dueño de las tablas y BYPASSA RLS (no usamos FORCE RLS). Por eso
--     NO se necesita una política para el dueño del negocio aquí.
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run.
--   (o `psql "$DATABASE_URL_DIRECT" -f supabase/migrations/0005_push_subscriptions.sql`)
--
-- Idempotente: se puede correr varias veces sin error (IF NOT EXISTS / drop policy).
-- ============================================================================

-- ─── Tabla push_subscriptions ───────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,                 -- RLS anchor
  customer_id uuid not null,
  endpoint    text not null unique,          -- URL del push endpoint; única globalmente
  p256dh      text not null,                 -- clave pública de la suscripción
  auth        text not null,                 -- secreto de auth de la suscripción
  created_at  timestamp not null default now()
);

-- ─── Preferencias de notificaciones en customers (aditivo, opt-out) ──────────
alter table public.customers
  add column if not exists notify_reward boolean not null default true;

alter table public.customers
  add column if not exists notify_new_stamp boolean not null default true;

-- ─── Permisos base para el rol authenticated ────────────────────────────────
-- RLS filtra filas; los GRANT habilitan la operación a nivel tabla.
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- ─── Habilitar RLS ──────────────────────────────────────────────────────────
alter table public.push_subscriptions enable row level security;

-- ============================================================================
-- POLÍTICA self — el cliente gestiona SOLO sus propias suscripciones
-- Mismo patrón de subselect que cards_self_select (0002), pero FOR ALL con
-- using + with check para cubrir insert/update/delete además de select.
-- ============================================================================
drop policy if exists push_subs_self_all on public.push_subscriptions;
create policy push_subs_self_all on public.push_subscriptions
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
create index if not exists idx_push_subs_customer_id on public.push_subscriptions (customer_id);
create index if not exists idx_push_subs_tenant_id   on public.push_subscriptions (tenant_id);
