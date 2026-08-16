export default function SubjectsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
      </div>

      <div className="mb-4">
        <div className="h-10 w-80 bg-gray-200 rounded-lg"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-4">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
