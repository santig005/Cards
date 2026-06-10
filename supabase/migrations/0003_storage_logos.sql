-- ============================================================================
-- Sellio · Storage — bucket público para logos de negocios
-- ----------------------------------------------------------------------------
-- El logo del negocio se muestra en el landing y la tarjeta del cliente (info
-- pública), así que el bucket es de lectura pública. La SUBIDA se hace siempre
-- server-side con el service role (createProgram), por eso no se necesitan
-- políticas de INSERT para anon/authenticated.
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → pegar → Run. Idempotente.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;
