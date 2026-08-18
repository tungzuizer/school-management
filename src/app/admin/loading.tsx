import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="p-6 max-w-5xl relative">
      <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-500 font-medium flex flex-col items-center justify-center gap-3 shadow-sm">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span>Đang tải dữ liệu...</span>
      </div>
    </div>
  );
}
