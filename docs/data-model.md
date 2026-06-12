# Data Model — Sellio

## Diagrama de relaciones

```
auth.users (Supabase managed)
    │
    ├─── tenants (owner_id → auth.users)
    │        │
    │        ├─── loyalty_programs (tenantId)
    │        │
    │        ├─── customers (tenantId)
    │        │        │
    │        │        └─── loyalty_cards (tenantId, customerId, programId)
    │        │                   │
    │        │                   └─── stamp_events (tenantId, cardId, customerId)
    │        │
    │        └─── stamp_events.registeredById → auth.users (empleado del tenant)
```

## Tablas

### `tenants`
Representa un negocio suscrito a Sellio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | Identificador único |
| name | text | Nombre del negocio |
| slug | text UNIQUE | URL-friendly: `sellio.app/[slug]` |
| logo_url | text? | URL del logo |
| owner_id | uuid | FK → auth.users (dueño del negocio) |
| collect_customer_data | boolean | Si solicita nombre/email al cliente |
| country_code | char(2) | ISO 3166-1 alpha-2 del negocio (default `CO`); ancla normalización de teléfono a E.164 (ADR-007) |
| timezone | text | Zona horaria IANA (default `America/Bogota`); agrupa analytics por día local |
| locale | text | Idioma del negocio: es \| en \| pt (default `es`) |
| created_at | timestamp | |
| updated_at | timestamp | |

### `loyalty_programs`
Configuración del programa de fidelización (una por tenant en MVP).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| tenant_id | uuid | FK → tenants (RLS anchor) |
| stamps_required | integer | Sellos necesarios para canjear |
| reward_type | enum | free_product / discount_percent / two_for_one / custom |
| reward_description | text | Descripción libre de la recompensa |
| is_active | boolean | Si el programa está activo |

### `customers`
Cliente final de un negocio. Identificado por celular.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| tenant_id | uuid | FK → tenants (RLS anchor) |
| phone | text | Número de celular (identificador primario) |
| name | text? | Opcional (si tenant.collect_customer_data = true) |
| email | text? | Opcional |
| auth_user_id | uuid? | FK → auth.users (se asigna tras primer OTP) |

### `loyalty_cards`
Tarjeta digital de un cliente en un programa específico.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| tenant_id | uuid | FK → tenants (RLS anchor) |
| customer_id | uuid | FK → customers |
| program_id | uuid | FK → loyalty_programs |
| current_stamps | integer | Sellos activos en el ciclo actual |
| total_redeemed | integer | Total de recompensas canjeadas |

### `stamp_events`
Auditoría inmutable de cada sello dado o canje realizado.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | |
| tenant_id | uuid | FK → tenants (RLS anchor) |
| card_id | uuid | FK → loyalty_cards |
| customer_id | uuid | FK → customers |
| registered_by_id | uuid | FK → auth.users (empleado) |
| event_type | enum | stamp / redeem |
| created_at | timestamp | |

## RLS — Regla de oro

Cada tabla tiene `tenant_id`. Las políticas RLS garantizan que un usuario solo ve filas donde `tenant_id = auth.jwt() ->> 'tenant_id'`. Esto se configura en Supabase antes de lanzar cualquier tabla a producción.
