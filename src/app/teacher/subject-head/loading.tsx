export default function SubjectHeadLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-28 bg-gray-200 rounded-2xl"></div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-64 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
