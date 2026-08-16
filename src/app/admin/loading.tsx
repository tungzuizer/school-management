export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-7xl animate-pulse p-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-100 rounded mt-2"></div>
        </div>
        <div className="h-9 w-44 bg-amber-100 rounded-xl"></div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
            <div className="h-7 w-14 bg-slate-300 rounded"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded"></div>
          <div className="h-[220px] bg-slate-100 rounded-lg"></div>
        </div>
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded"></div>
          <div className="h-[220px] bg-slate-100 rounded-lg"></div>
        </div>
      </div>

      {/* Charts Skeleton Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
