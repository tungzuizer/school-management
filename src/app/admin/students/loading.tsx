export default function StudentsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-36 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
          <div className="h-9 w-32 bg-indigo-200 rounded-xl" />
        </div>
      </div>

      {/* Campus filter row skeleton */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
        <div className="h-3.5 w-48 bg-slate-200 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-44 bg-indigo-100 rounded-xl" />
          <div className="h-8 w-32 bg-slate-100 rounded-xl" />
          <div className="h-8 w-32 bg-slate-100 rounded-xl" />
          <div className="h-8 w-32 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-60 bg-slate-100 rounded-xl" />
          <div className="h-9 w-36 bg-slate-100 rounded-xl" />
          <div className="h-9 w-40 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-9 w-44 bg-slate-100 rounded-xl" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-4 w-14 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="h-3 w-36 bg-slate-100 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-4 w-10 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
