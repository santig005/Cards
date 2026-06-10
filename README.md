# Sellio

Plataforma SaaS multi-tenant de fidelización digital para negocios físicos. Reemplaza las tarjetas físicas de sellos con una experiencia 100% digital via QR.

## Stack

- **Framework:** Next.js 16 + TypeScript
- **Estilos:** Tailwind CSS
- **DB:** Supabase (PostgreSQL) con RLS
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth (phone OTP para clientes, email/password para negocios)
- **Deploy:** Vercel

## Setup local

### 1. Requisitos

- Node.js 22+
- pnpm 11+
- Cuenta en [Supabase](https://supabase.com)

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Completar con tus credenciales de Supabase
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Correr en desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Base de datos

### Generar migración tras cambios en el schema

```bash
pnpm db:generate
```

### Aplicar migraciones

```bash
pnpm db:migrate
```

### Abrir Drizzle Studio (visualizador de DB)

```bash
pnpm db:studio
```

### Migraciones de seguridad y storage (escritas a mano)

Las políticas de RLS y el bucket de logos son SQL versionado en
[`supabase/migrations/`](supabase/migrations/). Se aplican desde el **SQL Editor**
de Supabase (o con `psql "$DATABASE_URL_DIRECT" -f <archivo>`), en orden:

| Archivo | Qué hace |
|---|---|
| `0001_rls_policies.sql` | Habilita RLS + políticas por tenant (dueño) |
| `0002_customer_rls.sql` | Acceso del cliente final a su propia tarjeta |
| `0003_storage_logos.sql` | Bucket público `logos` |

## Configuración inicial de Supabase (checklist)

1. **Aplicar las 3 migraciones SQL** de arriba en el SQL Editor.
2. **Auth → Providers → Email:** habilitado (registro/login de negocios).
3. **Auth → Providers → Phone:** habilitar para el OTP del cliente final.
   - Dev sin costo: agregar un **número de prueba** con código fijo en
     *Auth → Phone → Test OTP*.
   - Producción: conectar **Twilio** con canal **WhatsApp**.
4. **Storage:** el bucket `logos` lo crea `0003`; verificar que quede público.

## Tests y calidad

```bash
pnpm test        # unit tests (Vitest)
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm build       # build de producción
```

El CI (`.github/workflows/ci.yml`) corre lint → typecheck → test → build en cada PR.

## Documentación

- [`docs/data-model.md`](docs/data-model.md) — Schema de la base de datos
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`docs/phases/`](docs/phases/) — Fases del producto
- [`docs/lista-de-deseos.md`](docs/lista-de-deseos.md) — Backlog de ideas (incluye multi-país y multi-idioma)

## Arquitectura multi-tenant

Cada tabla usa `tenant_id` + RLS de PostgreSQL para aislar datos entre negocios. Ver [`docs/data-model.md`](docs/data-model.md) para detalles.
