-- ============================================================================
-- Sellio · RLS — acceso del CLIENTE FINAL a su propia tarjeta (Paso 2 / OTP)
-- ----------------------------------------------------------------------------
-- Contexto: ver docs/adr/ADR-004-customer-otp.md
--
-- Antes (Paso 1) solo el DUEÑO del negocio tenía políticas. Tras el OTP, el
-- cliente final también es un usuario autenticado (auth.users con su teléfono),
-- vinculado vía customers.auth_user_id. Estas políticas le dan acceso de SOLO
-- LECTURA a su propia ficha y a sus tarjetas — nada más.
--
-- Las políticas se SUMAN (OR) a las del dueño, así el dueño sigue viendo lo suyo.
-- La escritura del cliente (reclamar ficha al verificar OTP, crear tarjeta) corre
-- por la ruta de servicio, acotada por el teléfono YA verificado.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → pegar → Run. Idempotente.
-- ============================================================================

-- El rol authenticated ya tiene SELECT a nivel tabla (otorgado en 0001);
-- RLS es lo que restringe las filas.

-- ─── customers: el cliente ve su propia ficha ───────────────────────────────
drop policy if exists customers_self_select on public.customers;
create policy customers_self_select on public.customers
  for select using (auth_user_id = (select auth.uid()));

-- ─── loyalty_cards: el cliente ve sus propias tarjetas ──────────────────────
drop policy if exists cards_self_select on public.loyalty_cards;
create policy cards_self_select on public.loyalty_cards
  for select using (
    customer_id in (
      select id from public.customers where auth_user_id = (select auth.uid())
    )
  );

-- ─── Índice para el lookup por auth_user_id (usado por ambas políticas) ──────
create index if not exists idx_customers_auth_user_id on public.customers (auth_user_id);
