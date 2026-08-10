"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPLessonPlans } from "../actions";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

type VPLessonPlan = Awaited<ReturnType<typeof getVPLessonPlans>>[number];

export default function VPLessonPlansPage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [plans, setPlans] = useState<VPLessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getVPLessonPlans(campusId);
        setPlans(res);
      } catch (err) {
        console.error("Failed to load lesson plans:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Giáo án & Kế hoạch Bài dạy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi tiến độ duyệt và hồ sơ giáo án của giáo viên thuộc Phân hiệu
        </p>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Danh sách Giáo án Phân hiệu</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải danh sách giáo án...</div>
        ) : (
          <div className="divide-y">
            {plans.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 text-base">{p.title}</h3>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">Giáo viên:</span> {p.teacherName} —{" "}
                    <span className="font-medium text-gray-700">Môn:</span> {p.subjectName} —{" "}
                    <span className="font-medium text-gray-700">Lớp/Khối:</span> {p.className}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    p.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : p.status === "SUBMITTED"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {p.status === "APPROVED" ? "Đã duyệt" : p.status === "SUBMITTED" ? "Chờ duyệt" : "Bản nháp"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(p.updatedAt).toLocaleDateString("vi-VN")}
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
