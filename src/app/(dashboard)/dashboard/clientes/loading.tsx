export default function ClientesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-100" />
      </div>

      <div className="h-12 rounded-2xl bg-amber-50 border border-amber-100" />
      <div className="h-10 rounded-xl bg-white border border-gray-200" />

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-2 w-full rounded-full bg-gray-100" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-gray-200 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
