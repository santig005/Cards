export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="h-20 rounded-2xl bg-white border border-gray-100" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-14 flex-1 rounded-xl bg-gray-200" />
        <div className="h-14 flex-1 rounded-xl bg-gray-100" />
      </div>

      <div className="h-60 rounded-2xl bg-white border border-gray-100" />
    </div>
  )
}
