/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/students/page.tsx`, `src/app/admin/students/components/StudentCredentialsModal.tsx`.
 * 2. Affected APIs: `getStudentCredentialSlips` in `src/app/admin/students/actions.ts`.
 * 3. Data Schemas: `slips` (`id`, `studentName`, `studentCode`, `className`, `email`, `parentName`, `parentPhone`, `passwordHint`, `generatedDate`), `schoolName`, `className`.
 * 4. Verbatim User Instruction: "tôi muốn mỗi giáo viên mỗi học sinh sẽ có tài khoản mà mật khẩu và có thể hiện thị chỉ cho hiệu trưởng hoặc admin nhìn thấy được".
 */

"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";
import { Printer, Shield, GraduationCap } from "lucide-react";

interface StudentSlipItem {
  id: string;
  studentName: string;
  studentCode: string;
  className: string;
  email: string;
  parentName: string;
  parentPhone: string;
  passwordHint: string;
  generatedDate: string;
}

interface StudentCredentialSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  className?: string;
  slips: StudentSlipItem[];
}

export default function StudentCredentialSlipsModal({
  isOpen,
  onClose,
  schoolName,
  className,
  slips,
}: StudentCredentialSlipsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`In Phiếu Bàn Giao Tài Khoản Học Sinh ${className ? `- Lớp ${className}` : ""}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-700 font-medium">
            Tổng số phiếu: <strong className="text-emerald-700 font-bold">{slips.length}</strong> học sinh
            {className && <span className="ml-1 text-slate-500">(Lớp {className})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active-press cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu bàn giao (A4)</span>
            </button>
          </div>
        </div>

        {/* Printable Container */}
        <div
          ref={printRef}
          className="max-h-[60vh] overflow-y-auto p-4 bg-slate-100/60 rounded-2xl border border-slate-200 space-y-4 print:p-0 print:bg-white print:border-none print:max-h-none"
        >
          {slips.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Không có dữ liệu học sinh để in phiếu.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {slips.map((slip, idx) => (
                <div
                  key={slip.id || idx}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 relative shadow-xs print:shadow-none print:border-slate-400 print:break-inside-avoid space-y-3"
                >
                  {/* Header of slip */}
                  <div className="border-b border-slate-200 pb-2 flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {schoolName || "TRƯỜNG THPT"}
                      </div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                        PHIẾU CẤP TÀI KHOẢN HỌC SINH
                      </h4>
                    </div>
                    <div className="p-1 bg-emerald-50 text-emerald-700 rounded-lg">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Body info */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Học sinh:</span>
                      <div className="text-right">
                        <strong className="text-slate-900 font-bold">{slip.studentName}</strong>
                        {slip.studentCode && (
                          <span className="text-[10px] text-slate-500 ml-1 font-mono">({slip.studentCode})</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Lớp:</span>
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {slip.className}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Tài khoản (Email/SĐT):</span>
                      <code className="font-mono bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
                        {slip.email}
                      </code>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Mật khẩu khởi tạo:</span>
                      <code className="font-mono bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-xs font-black tracking-wider">
                        {slip.passwordHint}
                      </code>
                    </div>
                    {slip.parentName && (
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-[11px]">
                        <span className="text-slate-500">Phụ huynh:</span>
                        <span className="text-slate-700">
                          {slip.parentName} {slip.parentPhone ? `(${slip.parentPhone})` : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Security footer notice */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex items-start gap-1.5 text-[10px] text-slate-600">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Học sinh và Phụ huynh đăng nhập hệ thống để xem thời khóa biểu, điểm số và bài tập. <strong>Đổi mật khẩu ngay sau lần đăng nhập đầu tiên</strong>.
                    </span>
                  </div>

                  {/* Signature row */}
                  <div className="flex justify-between items-end pt-2 text-[10px] text-slate-500">
                    <div>Ngày cấp: {slip.generatedDate}</div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">GIÁO VIÊN CHỦ NHIỆM / BGH</div>
                      <div className="text-[9px] italic text-slate-400 mt-4">(Ký nhận bàn giao)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
