"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileSearch,
  Info,
} from "lucide-react";
import type { AIGroundedResponse } from "@/lib/ai/data-integrity";

interface GroundedResponseCardProps {
  grounded: AIGroundedResponse;
  className?: string;
}

export function GroundedResponseCard({
  grounded,
  className = "",
}: GroundedResponseCardProps) {
  // 1. Case: Insufficient Data
  if (grounded.isInsufficientData) {
    return (
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-3 shadow-lg ${className}`}
      >
        <div className="flex items-center gap-2.5 text-slate-300 font-semibold text-sm">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span>TRẠNG THÁI: KHÔNG ĐỦ DỮ LIỆU</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                INSUFFICIENT_DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Hệ thống không tự ý suy đoán hoặc làm tròn khi chưa đủ cơ sở dữ liệu thực tế.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
          {grounded.missingDataReason || grounded.rawText}
        </div>
      </div>
    );
  }

  // 2. Case: Unverified Records / Hallucination Detected
  if (grounded.hasHallucinations) {
    return (
      <div
        className={`bg-rose-950/40 border border-rose-600/40 rounded-2xl p-5 space-y-4 shadow-xl ${className}`}
      >
        <div className="flex items-center gap-3 text-rose-300">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200">
              CẢNH BÁO TOÀN VẸN DỮ LIỆU: PHÁT HIỆN BẢN GHI CHƯA XÁC THỰC
            </h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              AI đã trích dẫn mã bản ghi không tồn tại trong cơ sở dữ liệu trường học.
            </p>
          </div>
        </div>

        <div className="bg-rose-950/60 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-200 space-y-1.5 font-mono">
          <div className="font-semibold text-rose-300">Mã bản ghi không hợp lệ:</div>
          <div className="flex flex-wrap gap-1.5">
            {grounded.unverifiedRecordIds.map((id) => (
              <span
                key={id}
                className="px-2 py-0.5 rounded bg-rose-900/80 border border-rose-700 text-rose-200"
              >
                {id}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasFacts = grounded.facts.length > 0;
  const hasInferences = grounded.inferences.length > 0;

  // 3. Case: Standard Grounded Content with Fact vs Inference Split
  return (
    <div className={`space-y-4 ${className}`}>
      {/* SECTION 1: VERIFIED FACTS */}
      {hasFacts && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              DỮ KIỆN THỰC TẾ — CÓ TRUY VẾT DATABASE
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Đã xác thực DB ({grounded.verifiedRecordIds.length} bản ghi)
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {grounded.facts.map((fact, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2 text-xs text-slate-200"
              >
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{fact.statement}</div>
                </div>

                {fact.recordIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <FileSearch className="w-3 h-3 text-slate-500" /> Nguồn:
                    </span>
                    {fact.recordIds.map((id) => (
                      <span
                        key={id}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-[10px]"
                      >
                        {fact.sourceTable ? `${fact.sourceTable}#` : ""}
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: AI INFERENCES */}
      {hasInferences && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              SUY LUẬN AI — CẦN CON NGƯỜI XÁC MINH
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Giả thuyết / Gợi ý
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {grounded.inferences.map((inf, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-2 text-xs text-slate-200"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{inf.hypothesis}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                  <strong>Yêu cầu xác minh:</strong> {inf.verificationRequired}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback to raw text if no structured facts/inferences parsed */}
      {!hasFacts && !hasInferences && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
          {grounded.rawText}
        </div>
      )}
    </div>
  );
}
