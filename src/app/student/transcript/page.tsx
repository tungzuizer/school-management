"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getStudentTranscripts } from "@/app/actions/transcript";
import PrintableTranscript from "@/components/transcript/PrintableTranscript";
import { Loader2, Calendar, BookOpen, AlertCircle } from "lucide-react";

export default function StudentTranscriptPage() {
  const { data: session } = useSession();
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTranscripts() {
      if (!session?.user?.id) return;
      setLoading(true);
      const res = await getStudentTranscripts(session.user.id);
      if (res.success && res.data) {
        setTranscripts(res.data);
        if (res.data.length > 0) {
          setSelectedTranscriptId(res.data[0].id);
        }
      } else {
        setError(res.error || "Không thể tải danh sách học bạ");
      }
      setLoading(false);
    }
    fetchTranscripts();
  }, [session]);

  const activeTranscript = transcripts.find((t) => t.id === selectedTranscriptId) || transcripts[0];

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-indigo-600 font-semibold">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Đang tải thông tin học bạ điện tử...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl text-white shadow-lg">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Cổng Tra Cứu Học Sinh
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2">Học Bạ Điện Tử Của Tôi</h1>
              <p className="text-slate-300 text-sm mt-1">
                Theo dõi kết quả học tập, rèn luyện và tổng kết cả năm học theo chuẩn Bộ GD&ĐT
              </p>
            </div>

            {/* School Year Picker Pill */}
            {transcripts.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <Calendar className="w-4 h-4 text-slate-300" />
                <select
                  value={selectedTranscriptId}
                  onChange={(e) => setSelectedTranscriptId(e.target.value)}
                  className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
                >
                  {transcripts.map((t) => (
                    <option key={t.id} value={t.id} className="text-gray-900">
                      Năm học: {t.schoolYear} - Khối {t.gradeLevel} ({t.classRoom?.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Printable & Standard Formatted Sheet */}
        {activeTranscript ? (
          <PrintableTranscript
            transcript={activeTranscript}
            studentName={session?.user?.name || undefined}
          />
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-800">Chưa có học bạ điện tử nào</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Hệ thống chưa tạo hồ sơ học bạ cho năm học này hoặc Giáo viên chủ nhiệm đang hoàn thiện tổng kết.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
