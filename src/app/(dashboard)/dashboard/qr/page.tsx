import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants, loyaltyPrograms } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRDisplay } from './qr-display'

export default async function QRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [tenant] = await db.select().from(tenants).where(eq(tenants.ownerId, user!.id)).limit(1)

  if (!tenant) redirect('/login')

  const [program] = await db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.tenantId, tenant!.id)).limit(1)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const clientUrl = `${appUrl}/c/${tenant!.slug}`

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi QR</h1>
          <p className="text-gray-500 text-sm mt-1">Código QR para tus clientes</p>
        </div>
        <Card padding="lg" className="text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h2 className="font-semibold text-gray-800">Configurá tu programa primero</h2>
          <p className="text-sm text-gray-500">
            Antes de ver tu QR, configurá tu programa de fidelización.
          </p>
          <Link href="/dashboard/onboarding">
            <Button size="md">Configurar programa</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi QR</h1>
        <p className="text-gray-500 text-sm mt-1">Compartí este código con tus clientes</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card padding="lg" className="border-amber-100 shadow-xl shadow-amber-50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shrink-0" />
              <span className="text-sm font-semibold text-amber-700">{tenant!.name}</span>
            </div>
          </div>
          <QRDisplay url={clientUrl} tenantName={tenant!.name} />
        </Card>

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏅</span>
          <div className="text-sm">
            <span className="font-semibold text-amber-800">{program.stampsRequired} sellos</span>
            <span className="text-amber-700"> para ganar: </span>
            <span className="text-amber-700">{program.rewardDescription}</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">← Volver al dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
