"use client";

import React from "react";
import { Lock, ShieldCheck, CheckCircle2, ArrowRight, Smartphone, FileCheck2, KeyRound } from "lucide-react";

interface SceneProps {
  progress: number;
}

export default function Scene6AuditLocking({ progress }: SceneProps) {
  const showSteps = progress > 0.15;
  const showLock = progress > 0.55;

  const steps = [
    { num: "1", title: "Bản Nháp", role: "Giáo viên", active: true },
    { num: "2", title: "Gửi Duyệt", role: "Phân hiệu", active: progress > 0.25 },
    { num: "3", title: "Thẩm Định", role: "Hiệu phó", active: progress > 0.4 },
    { num: "4", title: "Niêm Phong", role: "Hiệu trưởng", active: progress > 0.6 },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-900 overflow-hidden select-none">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#a855f715_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold tracking-wider uppercase mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Quy Trình Kỷ Cương & Bảo Mật Số</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Sổ Đầu Bài Số & Khóa Niêm Phong <span className="text-purple-400">4 Cấp</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Cắt giảm 90% áp lực sổ sách • Cơ chế khóa dữ liệu bất biến chống can thiệp số liệu 100%
        </p>
      </div>

      {/* Main Container: 4-Step Approval & Audit Lock Card */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col gap-4 my-2">
        {/* 4-Step Workflow Horizontal Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              Luồng Thẩm Định 4 Cấp - 6 Bước Chuẩn Hóa
            </span>
            <span className="text-[11px] font-mono text-purple-300">Tính Bất Biến Cao</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            {steps.map((step, idx) => (
              <div
                key={step.num}
                className={`relative p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-500 ${
                  step.active
                    ? "bg-purple-950/60 border-purple-500/50 text-white shadow-lg shadow-purple-950/40 scale-100"
                    : "bg-slate-800/40 border-slate-700 text-slate-500 scale-95"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mb-1 ${
                    step.active
                      ? "bg-purple-500 text-slate-950 shadow-md"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {step.num}
                </div>
                <h5 className="text-xs font-bold truncate w-full">{step.title}</h5>
                <span className="text-[10px] text-purple-200 mt-0.5 truncate">{step.role}</span>

                {idx < 3 && (
                  <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 text-purple-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audit Lock Feature Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sổ đầu bài số 1 chạm */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Sổ Đầu Bài Điện Tử 1 Chạm</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Điểm danh, ghi nhận tiết dạy và nhận xét trên điện thoại chỉ mất 30 giây; loại bỏ hoàn toàn việc ghi tay sổ giấy 100+ trang.
              </p>
            </div>
          </div>

          {/* Niêm phong khóa dữ liệu */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-700 ${
              showLock
                ? "bg-purple-950/80 border-purple-400/60 shadow-xl shadow-purple-950/60"
                : "bg-slate-900/80 border-slate-700/80"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${
                showLock
                  ? "bg-amber-500/20 border border-amber-400/50 text-amber-300 animate-pulse"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">Niêm Phong Khóa Dữ Liệu</h4>
                {showLock && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    LOCKED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Khi Hiệu trưởng phê duyệt, dữ liệu chuyển sang trạng thái bất biến. Mọi thao tác mở khóa đều bắt buộc giải trình và lưu vết kiểm toán số.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
