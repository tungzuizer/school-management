export default function StudentLoading() {
  return (
    <div className="space-y-5 md:space-y-6 animate-pulse p-2">
      {/* Header Banner Skeleton */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white space-y-3 opacity-80">
        <div className="h-7 w-48 bg-white/30 rounded-lg"></div>
        <div className="flex gap-4">
          <div className="h-4 w-28 bg-white/20 rounded"></div>
          <div className="h-4 w-40 bg-white/20 rounded"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
            <div className="h-8 w-16 bg-slate-300 rounded"></div>
          </div>
        ))}
      </div>

      {/* Grid Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="h-6 w-36 bg-slate-200 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl"></div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="h-6 w-40 bg-slate-200 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
