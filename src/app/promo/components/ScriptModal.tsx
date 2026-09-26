"use client";

import React, { useState } from "react";
import { X, Copy, Check, FileText, Download, Sparkles, Film } from "lucide-react";
import { VIDEO_SCENES } from "./video-data";

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScriptModal({ isOpen, onClose }: ScriptModalProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const fullScriptText = VIDEO_SCENES.map(
    (scene, idx) =>
      `PHÂN CẢNH ${idx + 1}: ${scene.title.toUpperCase()} (${scene.duration} giây)
[Phân loại: ${scene.badge}]
- Mục tiêu: ${scene.subtitle}
- Lời bình (Voiceover): "${scene.voiceover}"
- Phụ đề hiển thị: ${scene.shortCaption}
- Điểm nhấn chính:
${scene.keyPoints.map((p) => `  * ${p}`).join("\n")}
`
  ).join("\n------------------------------------------------------------\n\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([fullScriptText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kich-Ban-Video-Marketing-School-Management.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Kịch Bản Video Marketing & Pitching 120s</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Chuẩn 7 Phân Cảnh
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Toàn bộ lời bình (Voiceover), visual cues, text overlay & số liệu thực chứng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Tải file .MD</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {VIDEO_SCENES.map((scene, idx) => (
            <div
              key={scene.id}
              className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-white text-base">{scene.title}</h4>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  ⏱️ {scene.duration}s
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed">
                <span className="font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  🎙️ Lời Bình Thuyết Minh (Voiceover):
                </span>
                "{scene.voiceover}"
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-slate-400 block mb-1">💬 Subtitle / Phụ đề:</span>
                  <span className="text-slate-200">{scene.shortCaption}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-slate-400 block mb-1">🎯 Điểm nhấn cốt lõi:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {scene.keyPoints.slice(0, 2).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
