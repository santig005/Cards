'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRDisplayProps {
  url: string
  tenantName: string
}

export function QRDisplay({ url, tenantName }: QRDisplayProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const svgElement = document.getElementById('qr-code-svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const link = document.createElement('a')
    link.href = svgUrl
    link.download = `qr-${tenantName.toLowerCase().replace(/\s+/g, '-')}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(svgUrl)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div className="p-5 bg-white rounded-2xl border-2 border-violet-200 shadow-lg shadow-violet-100">
        <QRCodeSVG
          id="qr-code-svg"
          value={url}
          size={256}
          level="M"
          marginSize={2}
          fgColor="#7c3aed"
        />
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-gray-500 max-w-xs">
        Mostrá este QR a tus clientes para que acumulen sellos. Pueden escanearlo con la cámara
        de su celular, sin necesidad de descargar ninguna app.
      </p>

      {/* Link */}
      <div className="w-full">
        <p className="text-xs font-medium text-gray-500 mb-2 text-center">Link directo</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
          <span className="flex-1 text-sm text-gray-700 truncate font-mono">{url}</span>
          <button
            onClick={handleCopy}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
            }`}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors underline underline-offset-4"
      >
        ⬇️ Descargar QR como SVG
      </button>
    </div>
  )
}
