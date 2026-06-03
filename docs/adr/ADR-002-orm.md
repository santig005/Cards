# ADR-002: Drizzle ORM sobre Prisma

**Fecha:** 2026-05-27  
**Estado:** Aceptada

## Contexto

El proyecto necesita un ORM para interactuar con PostgreSQL (Supabase) desde Next.js. Los dos candidatos principales en el ecosistema TypeScript son Drizzle y Prisma.

## Opciones evaluadas

- **Prisma:** ORM maduro, excelente DX, gran ecosistema. Pero requiere un proceso separado (`prisma generate`), tiene overhead en edge/serverless y el cliente de Prisma no funciona bien con el connection pooler de Supabase en modo Transaction.
- **Drizzle ORM:** Más liviano, sin proceso separado, 100% TypeScript (el schema ES TypeScript), excelente soporte para postgres.js que funciona perfectamente con el pooler de Supabase. Queries type-safe sin magia de generación de código.

## Decisión

Se elige **Drizzle ORM** porque:
- El schema en TypeScript puro reduce la fricción del workflow (sin `prisma generate`).
- `postgres` (driver) + `{ prepare: false }` es la combinación recomendada para Supabase Transaction pooler en entornos serverless como Vercel.
- Menor footprint en bundle — importante para Next.js App Router con Server Components.

## Consecuencias

- Las migraciones se generan con `drizzle-kit generate` y se aplican con `drizzle-kit migrate`.
- El archivo `drizzle.config.ts` en la raíz apunta al schema y a la carpeta `supabase/migrations/`.
- Los tipos de la DB se infieren directamente del schema con `$inferSelect` / `$inferInsert`.
