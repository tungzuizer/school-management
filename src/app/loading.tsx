import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center gap-3 shadow-sm max-w-md w-full">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span>Đang tải...</span>
      </div>
    </div>
  );
}
