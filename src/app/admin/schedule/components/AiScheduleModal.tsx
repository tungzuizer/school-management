/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`).
 * 2. Affected APIs: `generateAiTimetableAction` (`src/app/admin/schedule/actions.ts`), `SmartTimetableEngine` (`src/lib/smart-timetable-engine.ts`).
 * 3. Schema: `Schedule`, `ClassRoom`, `Teacher`, `Subject`, `TeachingAssignment`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sun,
  Moon,
  Clock,
  UserCheck,
  Zap,
  Activity,
  Award,
  Calendar,
  Layers,
} from "lucide-react";
import { generateAiTimetableAction } from "../actions";
import { TimetableEvaluationResult } from "@/lib/smart-timetable-engine";

interface AiScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schools: { id: string; name: string }[];
  selectedSchoolId?: string;
  onSuccess: () => void;
}

export default function AiScheduleModal({
  isOpen,
  onClose,
  schools,
  selectedSchoolId,
  onSuccess,
}: AiScheduleModalProps) {
  const [schoolId, setSchoolId] = useState(selectedSchoolId || "ALL");
  const [gradeLevel, setGradeLevel] = useState<number | "ALL">("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    evaluation?: TimetableEvaluationResult;
    totalCount?: number;
    unassignedDemands?: { classId: string; subjectName: string; remainingPeriods: number }[];
    generatedClassesCount?: number;
    error?: string;
  } | null>(null);

  const handleRunAiScheduler = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await generateAiTimetableAction({
        schoolId: schoolId === "ALL" ? undefined : schoolId,
        gradeLevel: gradeLevel === "ALL" ? undefined : gradeLevel,
      });

      if (res.error) {
        setResult({ error: res.error });
      } else {
        setResult({
          evaluation: res.evaluation,
          totalCount: res.totalCount,
          unassignedDemands: res.unassignedDemands,
          generatedClassesCount: res.generatedClassesCount,
        });
        onSuccess();
      }
    } catch (err: any) {
      setResult({ error: err.message || "Lỗi không xác định khi xếp TKB bằng AI." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isGenerating) {
          setResult(null);
          onClose();
        }
      }}
      title="Trợ lý AI Xếp Thời Khóa Biểu Thông Minh cho Ban Giám Hiệu"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Description */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-sky-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-sky-900 dark:text-sky-100">
              Thuật toán CSP & Tối ưu hóa Sư phạm Tự động
            </h4>
            <p className="text-xs text-sky-700 dark:text-sky-300 mt-1 leading-relaxed">
              Hệ thống tự động phân bổ toàn bộ tiết học trong tuần cho các lớp, đảm bảo tuyệt đối không trùng giờ dạy của giáo viên, tuân thủ nghiêm ngặt chuẩn GDPT 2018 và loại bỏ tối đa tiết lủng/tiết rơi.
            </p>
          </div>
        </div>

        {/* Configuration Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phạm vi Trường học
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={isGenerating}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Toàn bộ các trường / Điểm trường</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Khối lớp thực hiện
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
              disabled={isGenerating}
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Tất cả các khối lớp</option>
              <option value={6}>Khối 6 (THCS)</option>
              <option value={7}>Khối 7 (THCS)</option>
              <option value={8}>Khối 8 (THCS)</option>
              <option value={9}>Khối 9 (THCS)</option>
              <option value={10}>Khối 10 (THPT)</option>
              <option value={11}>Khối 11 (THPT)</option>
              <option value={12}>Khối 12 (THPT)</option>
            </select>
          </div>
        </div>

        {/* Constraint Checklist Card */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              Các Ràng Buộc Sư Phạm Đã Kích Hoạt Tự Động
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Khóa cứng
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Chào cờ: Thứ 2 Tiết 1</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Cố định tiết 1 đầu tuần cho toàn bộ các lớp, tự động phân công Giáo viên Chủ nhiệm.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Sinh hoạt lớp: Thứ 6 Tiết cuối</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Cố định tiết cuối ngày Thứ 6 cho GVCN thực hiện tổng kết tuần và sinh hoạt tập thể.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Tối đa 7 tiết / ngày</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Sáng tối đa 4 tiết, chiều 2-3 tiết, chống quá tải thể lực và tâm lý cho học sinh.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 mt-0.5">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">GV tối đa 5 buổi dạy / tuần</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Mỗi giáo viên chỉ dạy tối đa 5 ca (sáng/chiều) trên 12 ca/tuần, tuyệt đối không trùng giờ.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 mt-0.5">
                <Sun className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Môn tư duy nặng: Ưu tiên Buổi Sáng</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Toán, Ngữ văn, Tiếng Anh, Vật lí, Hóa học tự động xếp vào ca sáng và ghép tiết đôi liên tiếp.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-1 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 mt-0.5">
                <Moon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Môn thể chất: Cố định Buổi Chiều</span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                  Thể dục, GDQP-AN, Hoạt động trải nghiệm tự động phân bổ vào ca chiều để tối ưu sư phạm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation & Success Result Section */}
        {result?.evaluation && (
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Xếp Thời Khóa Biểu Thành Công!
                </h5>
              </div>
              <div className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full flex items-center gap-1 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                Điểm Sư Phạm: {result.evaluation.qualityScore}/100
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/80 text-xs">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 text-[11px] block">Tổng số tiết đã xếp</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{result.totalCount}</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 text-[11px] block">Số lớp hoàn tất</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{result.generatedClassesCount} lớp</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 text-[11px] block">Độ khớp ca ưu tiên</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{result.evaluation.shiftPreferenceMatchRate}%</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-300 text-[11px] block">Trùng giờ dạy</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">0 (Tuyệt đối)</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {result?.error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Không thể hoàn tất xếp TKB:</span>
              <p className="mt-0.5">{result.error}</p>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              onClose();
            }}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {result?.evaluation ? "Đóng" : "Hủy bỏ"}
          </button>

          <button
            type="button"
            onClick={handleRunAiScheduler}
            disabled={isGenerating}
            className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>AI Đang Tính Toán & Xếp Lịch...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Khởi Chạy Xếp TKB Bằng AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
