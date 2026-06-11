'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'

interface PosterViewProps {
  tenantName: string
  logoUrl: string | null
  rewardDescription: string
  stampsRequired: number
  url: string
}

export function PosterView({ tenantName, logoUrl, rewardDescription, stampsRequired, url }: PosterViewProps) {
  const t = useTranslations('poster')

  return (
    <div>
      {/* Controles — no se imprimen */}
      <div className="print:hidden flex items-center justify-between gap-3 mb-6 max-w-[420px] mx-auto">
        <Link href="/dashboard/qr">
          <Button variant="ghost" size="sm" className="text-muted">{t('back')}</Button>
        </Link>
        <Button
          type="button"
          size="md"
          onClick={() => window.print()}
          className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_4px_16px_-2px_rgb(245_158_11_/_0.4)]"
        >
          {t('printSave')}
        </Button>
      </div>

      {/* EL AFICHE */}
      <div className="poster-sheet mx-auto w-full max-w-[420px] bg-white rounded-3xl overflow-hidden border border-amber-100 shadow-xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Header dorado */}
        <div
          className="relative px-8 pt-10 pb-8 text-center"
          style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 45%, #f59e0b 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-white/5" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={`Logo de ${tenantName}`}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-stone-950/15"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-stone-950/15 flex items-center justify-center text-3xl font-bold text-stone-950">
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-3xl font-bold text-stone-950 leading-tight">{tenantName}</h1>
            <p className="text-stone-900/70 text-sm font-medium uppercase tracking-wider">
              {t('loyaltyProgram')}
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="px-8 py-8 text-center space-y-6">
          <div>
            <p className="text-gray-500 text-sm">{t('collectStamps')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1 leading-snug">{rewardDescription}</p>
            <p className="text-amber-600 text-sm font-semibold mt-2">
              {t('stampsToGet', { count: stampsRequired })}
            </p>
          </div>

          {/* QR */}
          <div className="inline-block bg-white rounded-2xl p-4 border-2 border-amber-100">
            <QRCodeSVG value={url} size={220} level="M" marginSize={2} fgColor="#92400e" />
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{t('scanInstructions')}</p>
            <p className="text-gray-500 text-sm">{t('scanSubtitle')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-gray-400">
            {t('poweredBy')} <span className="text-amber-500 font-semibold">Sellio</span>
          </p>
        </div>
      </div>

      <p className="print:hidden text-center text-xs text-muted mt-6 max-w-sm mx-auto">
        {t('printTip')}
      </p>
    </div>
  )
}
