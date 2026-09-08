/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`), Timetable Matrix View (`src/app/admin/schedule/components/TimetableMatrixView.tsx`).
 * 2. Affected APIs: `validateScheduleSwapAction`, `swapScheduleSlotsAction` (`src/app/admin/schedule/actions.ts`).
 * 3. Schema: `Schedule` (classId, subjectId, teacherId, dayOfWeek, period, room), `ClassRoom`, `Teacher`, `Subject`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  UserCheck,
  Calendar,
  Activity,
  Sparkles,
} from "lucide-react";
import { validateScheduleSwapAction, swapScheduleSlotsAction } from "../actions";

interface SlotInfo {
  dayOfWeek: number;
  period: number;
  subjectName?: string;
  teacherName?: string;
  isFixed?: boolean;
}

interface ScheduleSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  sourceSlot: SlotInfo | null;
  targetSlot: SlotInfo | null;
  onSuccess: () => void;
}

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

export default function ScheduleSwapModal({
  isOpen,
  onClose,
  classId,
  className,
  sourceSlot,
  targetSlot,
  onSuccess,
}: ScheduleSwapModalProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    conflicts: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sourceSlot && targetSlot && classId) {
      handleValidate();
    } else {
      setValidationResult(null);
      setError(null);
    }
  }, [isOpen, sourceSlot, targetSlot, classId]);

  const handleValidate = async () => {
    if (!sourceSlot || !targetSlot) return;
    setIsValidating(true);
    setError(null);

    try {
      const res = await validateScheduleSwapAction({
        classId,
        sourceSlot: { dayOfWeek: sourceSlot.dayOfWeek, period: sourceSlot.period },
        targetSlot: { dayOfWeek: targetSlot.dayOfWeek, period: targetSlot.period },
      });
      setValidationResult(res);
    } catch (err: any) {
      setError(err.message || "Lỗi kiểm tra tính hợp lệ của việc đổi tiết.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!sourceSlot || !targetSlot) return;
    setIsSwapping(true);
    setError(null);

    try {
      const res = await swapScheduleSlotsAction({
        classId,
        sourceSlot: { dayOfWeek: sourceSlot.dayOfWeek, period: sourceSlot.period },
        targetSlot: { dayOfWeek: targetSlot.dayOfWeek, period: targetSlot.period },
      });

      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi thực hiện hoán đổi tiết học.");
    } finally {
      setIsSwapping(false);
    }
  };

  if (!sourceSlot || !targetSlot) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSwapping) onClose();
      }}
      title={`Xác Nhận & Kiểm Tra Đổi Tiết Học - Lớp ${className}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Visual Swap Direction Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* Source Slot */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tiết nguồn
              </span>
              <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[11px] font-bold rounded">
                {DAY_LABELS[sourceSlot.dayOfWeek]} - Tiết {sourceSlot.period}
              </span>
            </div>
            <div className="pt-1">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {sourceSlot.subjectName || "(Ô trống / Chưa có môn)"}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                {sourceSlot.teacherName || "Chưa phân công giáo viên"}
              </div>
            </div>
          </div>

          {/* Target Slot */}
          <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tiết đích
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded">
                {DAY_LABELS[targetSlot.dayOfWeek]} - Tiết {targetSlot.period}
              </span>
            </div>
            <div className="pt-1">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {targetSlot.subjectName || "(Ô trống / Chưa có môn)"}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                {targetSlot.teacherName || "Chưa phân công giáo viên"}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Validation Report */}
        {isValidating ? (
          <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            <Activity className="w-4 h-4 animate-spin text-sky-600" />
            <span>Đang kiểm tra xung đột trùng giờ GV, giới hạn 5 buổi/tuần & 7 tiết/ngày...</span>
          </div>
        ) : validationResult ? (
          validationResult.isValid ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đổi tiết Hợp Lệ (100% An Toàn)!</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Không phát hiện xung đột lịch dạy của giáo viên, không vi phạm giới hạn 7 tiết/ngày và giáo viên không bị vượt quá 5 buổi/tuần.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Cảnh Báo Xung Đột Sư Phạm:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-300 text-[11px] pl-1">
                {validationResult.conflicts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )
        ) : null}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSwapping}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirmSwap}
            disabled={isSwapping || (validationResult !== null && !validationResult.isValid)}
            className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSwapping ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Đang Cập Nhật TKB...</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                <span>Xác Nhận Hoán Đổi Tiết</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
