import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sellio — Fidelización digital',
  description: 'Reemplazá las tarjetas físicas de sellos con una experiencia 100% digital.',
}

// Next 15+: themeColor va en el export `viewport`, no en `metadata`.
// Color de marca actualizado a ámbar (antes era un morado heredado).
export const viewport: Viewport = {
  themeColor: '#f59e0b',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-surface text-gray-900">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
