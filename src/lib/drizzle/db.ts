import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Cache the postgres client on globalThis so that Next.js dev hot-reloads
// reuse a single client instead of opening a new connection pool on every
// module re-evaluation (which exhausts the Supabase pooler — EMAXCONN).
const globalForDb = globalThis as unknown as {
  __sellioClient?: ReturnType<typeof postgres>
}

const client =
  globalForDb.__sellioClient ??
  postgres(connectionString, {
    // prepare: false is required for Supabase Transaction pooler (port 6543)
    prepare: false,
    // Keep the per-instance pool tiny — serverless/dev don't need many
    max: 1,
    // Release idle connections back to the pooler after 20s
    idle_timeout: 20,
    // Don't hang forever if the pooler is saturated
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__sellioClient = client
}

export const db = drizzle(client, { schema })

/**
 * Drizzle transaction handle, derived from `db.transaction` so callbacks stay
 * fully typed without resorting to `any`.
 */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Runs `fn` inside a transaction scoped to an authenticated Supabase user, so
 * that PostgreSQL Row-Level Security (RLS) policies anchored on `auth.uid()`
 * actually apply.
 *
 * Why this exists: the app connects through the Supabase pooler as the `postgres`
 * role, which OWNS the tables and therefore BYPASSES RLS. Plain `db` queries are
 * trusted/service-level. To get real per-tenant isolation (the "regla de oro" in
 * CLAUDE.md), every owner-facing query must run as the `authenticated` role with
 * the user's id exposed via `request.jwt.claims` — that is exactly what
 * `auth.uid()` reads. See docs/adr/ADR-003-rls.md.
 *
 * Note: `SET LOCAL` is transaction-scoped, which is safe under the Supabase
 * Transaction pooler (port 6543) because the whole transaction runs on a single
 * backend connection.
 */
export async function withAuth<T>(
  userId: string,
  fn: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Expose the user id to RLS first (still running as the privileged role),
    // then drop privileges to `authenticated` so policies are enforced.
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify({
        sub: userId,
        role: 'authenticated',
      })}, true)`
    )
    await tx.execute(sql`set local role authenticated`)
    return fn(tx)
  })
}
