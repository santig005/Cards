import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="bg-stone-950 text-stone-100">

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-amber-500/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.5)]">
              <span className="text-stone-950 font-black text-sm">S</span>
            </div>
            <span className="font-bold text-stone-100 text-lg tracking-tight">Sellio</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-stone-400">
            <a href="#como-funciona" className="hover:text-amber-400 transition-colors">Cómo funciona</a>
            <a href="#features" className="hover:text-amber-400 transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-amber-400 transition-colors">Precios</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-stone-400 hover:text-stone-100 transition-colors hidden md:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-sm font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)] flex items-center"
            >
              Empezar gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-stone-950 via-[#1a0e00] to-stone-950 pt-32 pb-24 overflow-hidden">
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-medium mb-8 animate-fade-up">
            <span className="text-amber-500">✦</span>
            Fidelización digital para negocios
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6 animate-fade-up stagger-1">
            <span className="text-stone-100">Fidelizá a tus clientes.</span>
            <br />
            <span className="shimmer-gold">Sin tarjetas físicas.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-2">
            Creá tu programa de sellos digital en 2 minutos.
            <br className="hidden md:block" />
            Tus clientes acumulan puntos con su celular, sin apps.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14 animate-fade-up stagger-3">
            <Link
              href="/registro"
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_8px_24px_-4px_rgb(245_158_11_/_0.5)] flex items-center gap-2 animate-glow"
            >
              Empezar gratis — es gratis →
            </Link>
            <a
              href="#como-funciona"
              className="h-12 px-8 rounded-xl border border-stone-700 bg-stone-900/50 text-stone-300 font-semibold text-base hover:border-amber-500/40 hover:text-stone-100 transition-all flex items-center gap-2"
            >
              Ver cómo funciona
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-stone-800 animate-fade-up stagger-4">
            {[
              { value: '1.000+', label: 'negocios' },
              { value: '40.000+', label: 'clientes' },
              { value: '98%', label: 'retención' },
            ].map((stat) => (
              <div key={stat.label} className="px-8 py-3 text-center">
                <p className="text-2xl font-black text-amber-400">{stat.value}</p>
                <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Phone mockup */}
          <div className="mt-20 relative max-w-xs mx-auto animate-float">
            {/* Glow behind phone */}
            <div className="absolute inset-0 blur-3xl bg-amber-500/20 rounded-full scale-150" />

            {/* Phone frame */}
            <div className="relative bg-stone-900 rounded-[44px] p-3 border border-stone-700 shadow-[0_50px_100px_-20px_rgb(0_0_0_/_0.8)]">
              {/* Screen */}
              <div className="bg-[#0c0a09] rounded-[36px] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                {/* Status bar */}
                <div className="h-8 bg-stone-950 flex items-center justify-between px-6 pt-2">
                  <span className="text-stone-400 text-[10px]">9:41</span>
                  <div className="flex gap-1 items-center">
                    <div className="w-4 h-2 border border-stone-500 rounded-sm overflow-hidden">
                      <div className="w-3/4 h-full bg-amber-400 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* App content */}
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-stone-400 text-[10px]">Tu tarjeta</p>
                      <p className="text-stone-100 font-bold text-sm">Café El Rincón</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <span className="text-amber-400 text-[10px] font-bold">M</span>
                    </div>
                  </div>

                  {/* Loyalty card */}
                  <div
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg, #b45309 0%, #d97706 45%, #f59e0b 70%, #b45309 100%)',
                    }}
                  >
                    {/* Noise dots */}
                    <div
                      className="absolute inset-0 opacity-[0.06]"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-amber-900/70 text-[9px] uppercase tracking-widest font-bold">
                            SELLIO
                          </p>
                          <p className="text-stone-950 font-bold text-sm">Café El Rincón</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-stone-950/20 flex items-center justify-center text-stone-950 font-black text-sm">
                          C
                        </div>
                      </div>
                      {/* Stamps */}
                      <div className="grid grid-cols-5 gap-1.5 mb-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-full aspect-square rounded-full flex items-center justify-center text-[8px] ${
                              i < 7
                                ? 'bg-stone-950/30 text-stone-950/70'
                                : 'bg-stone-950/10 border border-stone-950/20'
                            }`}
                          >
                            {i < 7 ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                      <p className="text-stone-950/60 text-[9px]">7/10 · Café gratis al completar</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="bg-stone-900 rounded-xl p-3">
                    <div className="flex justify-between text-[10px] text-stone-400 mb-1.5">
                      <span>Progreso</span>
                      <span className="text-amber-400 font-semibold">7/10</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full">
                      <div className="h-full w-[70%] bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                    </div>
                  </div>

                  {/* Next reward hint */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-amber-400 text-sm">🏆</span>
                    <p className="text-[10px] text-amber-300">
                      ¡Te faltan <strong>3 sellos</strong> para tu café gratis!
                    </p>
                  </div>
                </div>
              </div>
              {/* Home indicator */}
              <div className="h-6 flex items-center justify-center">
                <div className="w-24 h-1 bg-stone-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-stone-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-amber-600 text-sm font-bold uppercase tracking-widest mb-3">
              Proceso
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-4">
              Configuralo en 3 pasos
            </h2>
            <p className="text-stone-500 text-lg max-w-xl mx-auto">
              De cero a tu programa de fidelización activo en menos de 5 minutos.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 border-l-4 border-l-amber-500 card-hover">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-black text-lg shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)]">
                  1
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  {/* Store icon */}
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0114.25 13h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Registrá tu negocio</h3>
              <p className="text-stone-500 leading-relaxed">
                Creá tu cuenta gratis en 2 minutos. Elegí tu recompensa y cuántos sellos se necesitan para canjearla.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 border-l-4 border-l-amber-500 card-hover">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-black text-lg shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)]">
                  2
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  {/* QR icon */}
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Compartí tu QR</h3>
              <p className="text-stone-500 leading-relaxed">
                Descargá tu QR único y mostralo en tu negocio. Tus clientes lo escanean y se registran automáticamente.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 border-l-4 border-l-amber-500 card-hover">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-black text-lg shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)]">
                  3
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  {/* Stamp icon */}
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A.75.75 0 0015.75 13.5h-7.5a.75.75 0 00-.75.75v4.5m9 0H7.5M12 3v2.25m0 0a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Tus clientes acumulan</h3>
              <p className="text-stone-500 leading-relaxed">
                Cada visita suma un sello digital. Cuando completan la tarjeta, la app les avisa que tienen su premio listo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="bg-stone-950 py-24">
        {/* Transition from light */}
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-3">
              Funciones
            </p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="shimmer-gold">Todo lo que necesitás</span>
            </h2>
            <p className="text-stone-400 text-lg max-w-xl mx-auto">
              Diseñado para negocios reales. Sin complicaciones.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔌',
                title: 'Sin app nativa',
                desc: 'Tus clientes solo necesitan su navegador. Sin descargas, sin fricciones.',
                delay: 'stagger-1',
              },
              {
                icon: '📱',
                title: 'QR instantáneo',
                desc: 'Tu código QR listo en 2 minutos. Imprimilo o ponelo en pantalla.',
                delay: 'stagger-2',
              },
              {
                icon: '🏆',
                title: 'Recompensas flexibles',
                desc: 'Café gratis, descuentos, 2x1. Vos definís qué ofrece tu programa.',
                delay: 'stagger-3',
              },
              {
                icon: '📊',
                title: 'Dashboard en tiempo real',
                desc: 'Ves cuántos clientes tenés, cuántos sellos se dieron y cuántos canjes.',
                delay: 'stagger-4',
              },
              {
                icon: '🔒',
                title: 'Sin vendor lock-in',
                desc: 'Tus datos son tuyos. Exportalos cuando quieras.',
                delay: 'stagger-5',
              },
              {
                icon: '🇨🇴',
                title: 'Hecho para LATAM',
                desc: 'Precios en pesos, soporte en español, pensado para el mercado colombiano.',
                delay: 'stagger-6',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`bg-stone-900 border border-amber-500/10 rounded-2xl p-6 card-hover animate-fade-up ${feature.delay} hover:border-amber-500/25 transition-colors`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-stone-100 text-lg mb-2">{feature.title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────── */}
      <section id="precios" className="bg-stone-50 py-24">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-amber-600 text-sm font-bold uppercase tracking-widest mb-3">
              Precios
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-4">
              Precios simples
            </h2>
            <p className="text-stone-500 text-lg">Sin sorpresas. Sin comisiones.</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-amber-400 shadow-[0_8px_40px_-8px_rgb(245_158_11_/_0.25)] relative overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-6 right-6">
                <span className="bg-amber-500 text-stone-950 text-xs font-black px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              {/* Subtle gold glow top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-t-3xl" />

              <div className="mb-6">
                <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">Gratis</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-stone-900">$0</span>
                  <span className="text-stone-400 mb-2">/mes</span>
                </div>
                <p className="text-stone-500 text-sm">Siempre gratis. Sin tarjeta de crédito.</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  '1 programa de fidelización',
                  'Clientes ilimitados',
                  'QR único para tu negocio',
                  'Dashboard con métricas básicas',
                  'Sin comisiones',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stone-700 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/registro"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-base hover:from-amber-400 hover:to-amber-500 transition-all shadow-[0_4px_16px_-4px_rgb(245_158_11_/_0.5)] flex items-center justify-center"
              >
                Empezar gratis →
              </Link>
            </div>

            {/* Pro plan */}
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm relative opacity-80">
              <div className="absolute top-6 right-6">
                <span className="bg-stone-100 text-stone-500 text-xs font-bold px-3 py-1 rounded-full border border-stone-200">
                  PRÓXIMAMENTE
                </span>
              </div>

              <div className="mb-6">
                <p className="text-stone-500 font-bold text-sm uppercase tracking-widest mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-stone-400">$XX</span>
                  <span className="text-stone-400 mb-2">/mes</span>
                </div>
                <p className="text-stone-400 text-sm">Precio por confirmar.</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Todo lo del plan gratis',
                  'Múltiples programas',
                  'Notificaciones push a clientes',
                  'Apple Wallet / Google Wallet',
                  'Analytics avanzados',
                  'API para integrar con tu POS',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stone-400 text-sm">
                    <span className="w-5 h-5 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 text-xs font-bold flex-shrink-0">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full h-12 rounded-xl bg-stone-100 text-stone-400 font-bold text-base cursor-not-allowed flex items-center justify-center border border-stone-200"
              >
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-amber-900 via-[#3d2200] to-stone-950 py-28 relative overflow-hidden">
        {/* Dot overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fcd34d 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Glow center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-stone-100 mb-6 leading-tight">
            Empezá a fidelizar hoy
          </h2>
          <p className="text-stone-400 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Sin tarjeta de crédito. Sin instalaciones. Listo en 2 minutos.
          </p>

          <Link
            href="/registro"
            className="inline-flex items-center h-14 px-10 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-black text-lg hover:from-amber-300 hover:to-amber-400 transition-all shadow-[0_12px_40px_-8px_rgb(245_158_11_/_0.6)] animate-glow"
          >
            Crear mi cuenta gratis →
          </Link>

          {/* Social proof countries */}
          <div className="mt-12 pt-8 border-t border-amber-500/10">
            <p className="text-stone-500 text-sm mb-4">Usado por negocios en</p>
            <div className="flex items-center justify-center gap-6 text-base">
              <span className="text-stone-300 font-medium">🇨🇴 Colombia</span>
              <span className="text-stone-700">·</span>
              <span className="text-stone-400 font-medium">🇲🇽 México</span>
              <span className="text-stone-700">·</span>
              <span className="text-stone-400 font-medium">🇦🇷 Argentina</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-stone-950 border-t border-amber-500/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-[0_4px_12px_-2px_rgb(245_158_11_/_0.4)]">
                  <span className="text-stone-950 font-black text-sm">S</span>
                </div>
                <span className="font-bold text-stone-100 text-lg tracking-tight">Sellio</span>
              </div>
              <p className="text-stone-500 text-sm max-w-xs leading-relaxed">
                Fidelización digital para negocios físicos en LATAM.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="text-stone-300 font-semibold text-sm mb-4">Producto</p>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Funciones', href: '#features' },
                    { label: 'Precios', href: '#precios' },
                    { label: 'Cómo funciona', href: '#como-funciona' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-stone-500 text-sm hover:text-amber-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-stone-300 font-semibold text-sm mb-4">Legal</p>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Términos', href: '/terminos' },
                    { label: 'Privacidad', href: '/privacidad' },
                  ].map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-stone-500 text-sm hover:text-amber-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-stone-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-stone-500 text-sm">
              © 2026 Sellio · Fidelización digital para LATAM
            </p>
            <p className="text-stone-600 text-sm">
              Hecho con ❤️ en Colombia
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
