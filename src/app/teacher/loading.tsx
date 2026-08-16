export default function TeacherLoading() {
  return (
    <div className="space-y-4 animate-pulse p-2">
      {/* Header controls skeleton */}
      <div className="bg-white border-b border-gray-200 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-8 w-40 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 w-44 bg-slate-100 rounded-lg"></div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-5 w-28 bg-slate-100 rounded"></div>
        </div>

        {/* Timetable/Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl border p-4 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-6 w-full bg-slate-200 rounded mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
