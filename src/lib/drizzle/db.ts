import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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
