'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomerItem, type CustomerRow } from './customer-item'

interface CustomerListProps {
  customers: CustomerRow[]
  stampsRequired: number
}

export function CustomerList({ customers, stampsRequired }: CustomerListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.name, c.phone, c.email].some((field) => field?.toLowerCase().includes(q))
    )
  }, [customers, query])

  // Sin clientes registrados todavía.
  if (customers.length === 0) {
    return (
      <Card padding="lg" className="text-center space-y-4 py-16">
        <div className="text-6xl">👥</div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aún no tenés clientes</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Compartí tu QR para que tus clientes empiecen a acumular sellos.
            ¡El primer cliente está a un escaneo de distancia!
          </p>
        </div>
        <Link href="/dashboard/qr">
          <Button size="md" className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
            Ver mi QR 📱
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente por nombre o teléfono..."
          aria-label="Buscar cliente"
          className="h-10 pl-9 pr-4 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
        />
      </div>

      {filtered.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <p className="text-sm text-gray-500">
            No hay clientes que coincidan con{' '}
            <span className="font-medium text-gray-700">&ldquo;{query}&rdquo;</span>.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, index) => (
            <CustomerItem key={c.customerId} customer={c} stampsRequired={stampsRequired} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
