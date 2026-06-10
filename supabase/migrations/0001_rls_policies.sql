-- ============================================================================
-- Sellio · RLS (Row-Level Security) — aislamiento multi-tenant
-- ----------------------------------------------------------------------------
-- Decisión: ver docs/adr/ADR-003-rls.md (Opción A).
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run.
--   (o `psql "$DATABASE_URL_DIRECT" -f supabase/migrations/0001_rls_policies.sql`)
--
-- Modelo:
--   * Las consultas del NEGOCIO (dashboard) corren con `withAuth()` como rol
--     `authenticated`, así que estas políticas SÍ se aplican y aíslan por tenant.
--   * Las rutas de servicio (registro del negocio, flujo público del cliente)
--     corren como el rol `postgres` (dueño de las tablas). NO usamos FORCE RLS,
--     así que esas rutas siguen funcionando por diseño. El flujo del cliente se
--     blinda con OTP en el Paso 2 (ADR pendiente).
--
-- Idempotente: se puede correr varias veces sin error.
-- ============================================================================

-- ─── Permisos base para el rol authenticated ────────────────────────────────
-- RLS filtra filas; los GRANT habilitan la operación a nivel tabla.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.tenants,
  public.loyalty_programs,
  public.customers,
  public.loyalty_cards,
  public.stamp_events
to authenticated;

-- ─── Habilitar RLS ──────────────────────────────────────────────────────────
alter table public.tenants            enable row level security;
alter table public.loyalty_programs   enable row level security;
alter table public.customers          enable row level security;
alter table public.loyalty_cards      enable row level security;
alter table public.stamp_events       enable row level security;

-- ============================================================================
-- POLÍTICAS — ancladas en auth.uid()
-- `(select auth.uid())` se envuelve en subselect para que el planner lo evalúe
-- una sola vez por consulta (recomendación de performance de Supabase).
-- ============================================================================

-- ─── tenants: el dueño solo ve / edita su propio negocio ────────────────────
drop policy if exists tenants_owner_select on public.tenants;
create policy tenants_owner_select on public.tenants
  for select using (owner_id = (select auth.uid()));

drop policy if exists tenants_owner_insert on public.tenants;
create policy tenants_owner_insert on public.tenants
  for insert with check (owner_id = (select auth.uid()));

drop policy if exists tenants_owner_update on public.tenants;
create policy tenants_owner_update on public.tenants
  for update using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ─── loyalty_programs: scoping por tenant del dueño ─────────────────────────
drop policy if exists programs_owner_all on public.loyalty_programs;
create policy programs_owner_all on public.loyalty_programs
  for all
  using (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  )
  with check (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  );

-- ─── customers: scoping por tenant del dueño ────────────────────────────────
drop policy if exists customers_owner_all on public.customers;
create policy customers_owner_all on public.customers
  for all
  using (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  )
  with check (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  );

-- ─── loyalty_cards: scoping por tenant del dueño ────────────────────────────
drop policy if exists cards_owner_all on public.loyalty_cards;
create policy cards_owner_all on public.loyalty_cards
  for all
  using (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  )
  with check (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  );

-- ─── stamp_events: scoping por tenant del dueño ─────────────────────────────
drop policy if exists stamp_events_owner_all on public.stamp_events;
create policy stamp_events_owner_all on public.stamp_events
  for all
  using (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  )
  with check (
    tenant_id in (select id from public.tenants where owner_id = (select auth.uid()))
  );

-- ─── Índices que sostienen las políticas (evitan seq scans en los checks) ────
create index if not exists idx_tenants_owner_id        on public.tenants (owner_id);
create index if not exists idx_programs_tenant_id      on public.loyalty_programs (tenant_id);
create index if not exists idx_customers_tenant_id     on public.customers (tenant_id);
create index if not exists idx_customers_tenant_phone  on public.customers (tenant_id, phone);
create index if not exists idx_cards_tenant_id         on public.loyalty_cards (tenant_id);
create index if not exists idx_cards_customer_program  on public.loyalty_cards (customer_id, program_id);
create index if not exists idx_stamp_events_tenant_id  on public.stamp_events (tenant_id);
create index if not exists idx_stamp_events_card_id    on public.stamp_events (card_id, created_at desc);
