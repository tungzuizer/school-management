"use client";

import React, { useState } from "react";
import { X, Sliders, Save, RotateCcw, ShieldAlert, Check } from "lucide-react";
import { DEFAULT_AI_THRESHOLDS } from "@/lib/ai-assistant/default-thresholds";

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: Record<string, number>;
  onSaveThreshold: (metricKey: string, value: number) => Promise<boolean>;
}

export default function ThresholdConfigModal({
  isOpen,
  onClose,
  currentThresholds,
  onSaveThreshold,
}: ThresholdConfigModalProps) {
  const [thresholds, setThresholds] = useState<Record<string, number>>(currentThresholds);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (key: string, valStr: string) => {
    const val = parseFloat(valStr);
    setThresholds((prev) => ({
      ...prev,
      [key]: isNaN(val) ? 0 : val,
    }));
  };

  const handleSaveItem = async (key: string) => {
    setSavingKey(key);
    const success = await onSaveThreshold(key, thresholds[key] ?? 0);
    setSavingKey(null);
    if (success) {
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    }
  };

  const handleResetDefaults = () => {
    const defaults: Record<string, number> = {};
    for (const [k, v] of Object.entries(DEFAULT_AI_THRESHOLDS)) {
      defaults[k] = v.thresholdValue;
    }
    setThresholds(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Cấu hình Ngưỡng Cảnh báo AI Thông minh</h2>
              <p className="text-xs text-indigo-200/80">
                Hiệu trưởng tùy chỉnh các ngưỡng kích hoạt phân tích cho 4 điểm trường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý:</strong> Khi điều chỉnh ngưỡng, hệ thống AI sẽ tự động tái đánh giá toàn bộ dữ liệu 4 điểm trường để sinh cảnh báo và đề xuất phương án điều hành tương ứng.
            </span>
          </div>

          <div className="divide-y divide-slate-100 space-y-3">
            {Object.entries(DEFAULT_AI_THRESHOLDS).map(([key, def]) => {
              const currentVal = thresholds[key] ?? def.thresholdValue;
              const isSaving = savingKey === key;
              const isSaved = savedKey === key;

              return (
                <div key={key} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {def.metricName}
                      <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {key}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-700 mt-0.5">{def.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={currentVal}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-20 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right pr-6"
                      />
                      <span className="absolute right-2 top-2 text-[10px] font-semibold text-slate-700 pointer-events-none">
                        {def.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSaveItem(key)}
                      disabled={isSaving}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSaved
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Lưu xong
                        </>
                      ) : isSaving ? (
                        "..."
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" /> Lưu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
