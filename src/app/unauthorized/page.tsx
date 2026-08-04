"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Không có quyền truy cập</h2>
        <p className="text-gray-500 mb-6">Bạn không được phép truy cập trang này.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Quay lại
        </button>
      </div>
    </div>
  );
}
