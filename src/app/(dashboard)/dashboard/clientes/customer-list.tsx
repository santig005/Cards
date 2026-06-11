'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomerItem, type CustomerRow } from './customer-item'
import { toCsv } from '@/lib/csv'

interface CustomerListProps {
  customers: CustomerRow[]
  stampsRequired: number
}

type SortBy = 'recent' | 'name' | 'stamps'
const PAGE_SIZE = 10

export function CustomerList({ customers, stampsRequired }: CustomerListProps) {
  const t = useTranslations('customers')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [page, setPage] = useState(0)

  const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: 'recent', label: t('sortRecent') },
    { value: 'name', label: t('sortName') },
    { value: 'stamps', label: t('sortStamps') },
  ]

  function downloadCustomersCsv(rows: CustomerRow[]) {
    const headers = [
      t('csvName'),
      t('csvPhone'),
      t('csvEmail'),
      t('csvCurrentStamps'),
      t('csvTotalRedeemed'),
      t('csvRegistered'),
    ]
    const data = rows.map((c) => [
      c.name ?? '',
      c.phone,
      c.email ?? '',
      c.currentStamps ?? 0,
      c.totalRedeemed ?? 0,
      new Date(c.createdAt).toISOString().slice(0, 10),
    ])
    // BOM (﻿) para que Excel respete los acentos.
    const csv = '﻿' + toCsv(headers, data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = !q
      ? customers
      : customers.filter((c) => [c.name, c.phone, c.email].some((f) => f?.toLowerCase().includes(q)))

    return [...base].sort((a, b) => {
      if (sortBy === 'name') return (a.name ?? a.phone).localeCompare(b.name ?? b.phone)
      if (sortBy === 'stamps') return (b.currentStamps ?? 0) - (a.currentStamps ?? 0)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // recientes
    })
  }, [customers, query, sortBy])

  // Clamp de la página en render (evita un useEffect): si el filtro achicó la
  // lista, la página fuera de rango se ajusta sola.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * PAGE_SIZE
  const paged = filtered.slice(start, start + PAGE_SIZE)

  // Sin clientes registrados todavía.
  if (customers.length === 0) {
    return (
      <Card padding="lg" className="text-center space-y-4 py-16">
        <div className="text-6xl">👥</div>
        <div>
          <h2 className="text-lg font-semibold text-fg mb-2">{t('noCustomersTitle')}</h2>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {t('noCustomersBody')}
          </p>
        </div>
        <Link href="/dashboard/qr">
          <Button size="md" className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]">
            {t('viewQr')}
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controles: buscar + ordenar + exportar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="h-10 pl-9 pr-4 w-full rounded-xl border border-border bg-surface text-sm text-fg placeholder:text-muted shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortBy)
            setPage(0)
          }}
          aria-label={t('sortLabel')}
          className="h-10 px-3 rounded-xl border border-border bg-surface text-sm text-fg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="md" onClick={() => downloadCustomersCsv(customers)} className="shrink-0">
          {t('exportCsv')}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <p className="text-sm text-gray-500">
            {t('noResults', { query })}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((c, index) => (
              <CustomerItem key={c.customerId} customer={c} stampsRequired={stampsRequired} index={index} />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-400 tabular-nums">
                {t('paginationRange', { from: start + 1, to: Math.min(start + PAGE_SIZE, filtered.length), total: filtered.length })}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                >
                  {t('previous')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  disabled={safePage >= pageCount - 1}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
