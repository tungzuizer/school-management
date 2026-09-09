/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/teachers/page.tsx`
 * 2. Affected APIs: `getTeacherCredentialSlips` in `src/app/admin/teachers/actions.ts`.
 * 3. Data Schemas: `SlipItem` (`id`, `teacherName`, `email`, `specialty`, `phone`, `passwordHint`, `generatedDate`), `schoolName`.
 * 4. Verbatim User Instruction: "tôi muốn mỗi giáo viên mỗi học sinh sẽ có tài khoản mà mật khẩu và có thể hiện thị chỉ cho hiệu trưởng hoặc admin nhìn thấy được".
 */

"use client";

import { useRef } from "react";
import Modal from "@/components/ui/Modal";
import { Printer, Shield, KeyRound } from "lucide-react";

interface SlipItem {
  id: string;
  teacherName: string;
  email: string;
  specialty: string;
  phone: string;
  passwordHint: string;
  generatedDate: string;
}

interface TeacherCredentialSlipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  slips: SlipItem[];
}

export default function TeacherCredentialSlipsModal({
  isOpen,
  onClose,
  schoolName,
  slips,
}: TeacherCredentialSlipsModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="In Phiếu Bàn Giao Tài Khoản & Mật Khẩu Giáo Viên"
      size="xl"
    >
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-700 font-medium">
            Tổng số phiếu: <strong className="text-indigo-600 font-bold">{slips.length}</strong> giáo viên
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active-press cursor-pointer"
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
              Không có dữ liệu giáo viên để in phiếu.
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
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-tight">
                        PHIẾU CẤP TÀI KHOẢN GIÁO VIÊN
                      </h4>
                    </div>
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg">
                      <KeyRound className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Body info */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Họ và tên:</span>
                      <strong className="text-slate-900 font-bold">{slip.teacherName}</strong>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Tổ bộ môn:</span>
                      <span className="text-indigo-700 font-semibold">{slip.specialty}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Tài khoản (Email):</span>
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
                  </div>

                  {/* Security footer notice */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex items-start gap-1.5 text-[10px] text-slate-600">
                    <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Vui lòng đăng nhập và <strong>đổi mật khẩu ngay lần đầu tiên</strong>. Bảo mật tài khoản giảng dạy và sổ điểm điện tử theo quy định của BGH.
                    </span>
                  </div>

                  {/* Signature row */}
                  <div className="flex justify-between items-end pt-2 text-[10px] text-slate-500">
                    <div>Ngày in: {slip.generatedDate}</div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">BAN GIÁM HIỆU</div>
                      <div className="text-[9px] italic text-slate-400 mt-4">(Ký và đóng dấu)</div>
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
