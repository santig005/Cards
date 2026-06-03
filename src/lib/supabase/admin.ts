import { createClient } from '@supabase/supabase-js'

// Solo usar en server-side (Route Handlers, Server Actions)
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
