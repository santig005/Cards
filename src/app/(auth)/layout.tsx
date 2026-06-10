export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — desktop only */}
      <div className="hidden md:flex md:w-[45%] relative overflow-hidden bg-gradient-to-br from-stone-950 via-[#1a0e00] to-[#2d1500] flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-white/8" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <span className="text-stone-950 text-base font-bold">S</span>
          </div>
          <span className="text-stone-100 font-bold text-xl tracking-tight">Sellio</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-stone-100 leading-tight">
              Fidelizá a tus clientes.<br />Sin tarjetas físicas.
            </h2>
            <ul className="space-y-3">
              {[
                'Sin app nativa',
                'QR listo en 2 minutos',
                'Gratis para empezar',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-stone-200 text-sm">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-amber-400" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial card */}
          <div className="rounded-2xl bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 p-5 space-y-3">
            <p className="text-stone-100/90 text-sm leading-relaxed">
              &ldquo;Aumenté la retención un 40% en los primeros dos meses. La experiencia del cliente es increíble.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0">
                J
              </div>
              <div>
                <p className="text-stone-100 text-xs font-semibold">Juan Martínez</p>
                <p className="text-stone-400 text-xs">Café El Rincón</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-stone-500 text-xs">© 2026 Sellio · Fidelización digital</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-12">
        {children}
      </div>
    </div>
  )
}
