import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// prepare: false required for Supabase Transaction pooler (port 6543)
// max: 1 keeps connection count low on serverless
const client = postgres(connectionString, { prepare: false, max: 1 })

export const db = drizzle(client, { schema })
