"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPJournals } from "../actions";
import { FileBarChart, BookOpen, Calendar } from "lucide-react";

type VPJournal = Awaited<ReturnType<typeof getVPJournals>>[number];

export default function VPJournalsPage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [journals, setJournals] = useState<VPJournal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getVPJournals(campusId);
        setJournals(res);
      } catch (err) {
        console.error("Failed to load journals:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sổ đầu bài Phân hiệu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi nhật ký giảng dạy và tình hình lớp học thuộc Phân hiệu
        </p>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Nhật ký giảng dạy gần đây</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải sổ đầu bài...</div>
        ) : (
          <div className="space-y-3">
            {journals.map((j) => (
              <div key={j.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-teal-700 text-white text-xs font-bold">
                      Lớp {j.className}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      Môn {j.subjectName} — Tiết {j.period}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(j.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  Bài dạy: {j.lessonTitle}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Giáo viên:</span> {j.teacherName} —{" "}
                  <span className="font-semibold text-gray-700">Ghi chú:</span> {j.content || "Không có ghi chú"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
