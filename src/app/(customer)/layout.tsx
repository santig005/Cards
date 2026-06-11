// El flujo del cliente tiene su propia identidad (oscura por diseño) y NO sigue
// el modo día/noche del panel. `force-light` mantiene sus tokens en claro aunque
// el documento esté en .dark.
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <div className="force-light">{children}</div>
}
