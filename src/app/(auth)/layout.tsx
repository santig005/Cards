export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-200 mb-4">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-3xl font-bold text-violet-900">Sellio</h1>
          <p className="text-gray-500 mt-1 text-sm">Fidelización digital para tu negocio</p>
        </div>
        {children}
      </div>
    </div>
  )
}
