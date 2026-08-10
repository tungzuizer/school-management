"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPWarnings } from "../actions";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

type VPWarning = Awaited<ReturnType<typeof getVPWarnings>>[number];

export default function VPWarningsPage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [warnings, setWarnings] = useState<VPWarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getVPWarnings(campusId);
        setWarnings(res);
      } catch (err) {
        console.error("Failed to load warnings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cảnh báo Phân hiệu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hệ thống cảnh báo sớm chuyên cần, nề nếp và học tập của học sinh Phân hiệu
        </p>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Cảnh báo đang hoạt động</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải cảnh báo...</div>
        ) : warnings.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Không có cảnh báo nào.</div>
        ) : (
          <div className="space-y-3">
            {warnings.map((w) => (
              <div
                key={w.id}
                className={`p-4 rounded-xl border ${
                  w.level === "HIGH" || w.level === "CRITICAL"
                    ? "border-red-200 bg-red-50/40"
                    : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        w.level === "HIGH" || w.level === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {w.level}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm">{w.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-2">{w.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500">Phân loại: <strong className="text-gray-800">{w.category}</strong></span>
                  <span className={`font-semibold ${w.resolved ? "text-green-600" : "text-amber-600"}`}>
                    {w.resolved ? "Đã xử lý" : "Chưa xử lý"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
