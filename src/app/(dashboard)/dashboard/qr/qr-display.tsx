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
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <span className="text-base">📲</span>
        </div>
        <p className="text-sm font-medium text-gray-600">Mostrá este QR en tu negocio</p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-3xl p-5 shadow-inner border border-gray-100 mx-auto w-fit">
        <QRCodeSVG
          id="qr-code-svg"
          value={url}
          size={256}
          level="M"
          marginSize={2}
          fgColor="#7c3aed"
        />
      </div>

      {/* Link pill + copy button */}
      <div className="mt-1 flex items-center gap-2 w-full">
        <div className="flex-1 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 text-xs font-mono text-violet-600 truncate">
          {url}
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {copied ? '✓' : 'Copiar'}
        </button>
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
