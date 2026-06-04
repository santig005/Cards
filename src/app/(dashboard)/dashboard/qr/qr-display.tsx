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
      {/* Instruction */}
      <p className="text-center text-sm text-gray-500 mb-4">
        Mostrá este QR en tu negocio para que los clientes acumulen sellos
      </p>

      {/* QR Code */}
      <div className="bg-white rounded-2xl p-4 mx-auto w-fit shadow-inner">
        <QRCodeSVG
          id="qr-code-svg"
          value={url}
          size={256}
          level="M"
          marginSize={2}
          fgColor="#7c3aed"
        />
      </div>

      {/* Link pill */}
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 text-sm font-mono text-violet-700 text-center break-all w-full">
        {url}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
          copied
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
        }`}
      >
        {copied ? '¡Copiado! ✓' : 'Copiar link'}
      </button>

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
