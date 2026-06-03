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

## Documentación

- [`docs/data-model.md`](docs/data-model.md) — Schema de la base de datos
- [`docs/adr/`](docs/adr/) — Architecture Decision Records
- [`docs/phases/`](docs/phases/) — Fases del producto

## Arquitectura multi-tenant

Cada tabla usa `tenant_id` + RLS de PostgreSQL para aislar datos entre negocios. Ver [`docs/data-model.md`](docs/data-model.md) para detalles.
