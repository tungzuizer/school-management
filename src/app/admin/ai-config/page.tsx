"use client";

import { useState, useEffect } from "react";
import { getAISettingsConfig, saveAISettingsConfig, testAIConnection } from "./actions";
import { useToast } from "@/components/ui/Toast";
import {
  Bot,
  Zap,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  Cpu,
  RefreshCw,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function AIConfigPage() {
  const [apiBase, setApiBase] = useState("http://127.0.0.1:20128/v1");
  const [apiKey, setApiKey] = useState("sk-omniroute-default");
  const [model, setModel] = useState("gpt-4o-mini");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text?: string; error?: string | null; latencyMs?: number } | null>(null);

  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getAISettingsConfig();
      if (res.success && res.settings) {
        setApiBase(res.settings.apiBase);
        setApiKey(res.settings.apiKey);
        setModel(res.settings.model);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveAISettingsConfig({ apiBase, apiKey, model });
    setSaving(false);

    if (res.success) {
      showToast("Đã lưu cấu hình OmniRoute AI thành công!", "success");
    } else {
      showToast(res.error || "Lưu cấu hình thất bại", "error");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testAIConnection();
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      showToast(`Kết nối OmniRoute AI thành công (${res.latencyMs}ms)!`, "success");
    } else {
      showToast("Kiểm tra kết nối thất bại!", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 text-sm font-semibold">Đang tải cấu hình AI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {ToastComponent}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black">Cấu Hình OmniRoute AI</h1>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200">
            Quản lý và kiểm tra kết nối API OmniRoute cho trợ lý AI Hiệu trưởng, xếp lịch dạy thay & báo cáo
          </p>
        </div>

        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Zap className={`w-4 h-4 ${testing ? "animate-bounce" : ""}`} />
          {testing ? "Đang test API..." : "⚡ Thử kết nối AI"}
        </button>
      </div>

      {/* Test Result Panel */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed animate-fade-in ${
            testResult.success
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm mb-1">
            <span className="flex items-center gap-1.5">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kết nối OmniRoute THÀNH CÔNG!
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Kết nối THẤT BẠI
                </>
              )}
            </span>
            {testResult.latencyMs && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/70 border">
                ⏱️ {testResult.latencyMs} ms
              </span>
            )}
          </div>

          {testResult.success ? (
            <p className="mt-1 font-mono bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              "{testResult.text}"
            </p>
          ) : (
            <p className="mt-1 font-mono bg-white/80 p-2.5 rounded-xl border border-rose-200 text-rose-800">
              {testResult.error}
            </p>
          )}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Thông số kết nối OmniRoute Gateway
        </h2>

        {/* API Base URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-indigo-600" />
            1. Đường dẫn URL Cổng OmniRoute (API Base URL) *
          </label>
          <input
            type="text"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="http://127.0.0.1:20128/v1"
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-[11px] text-slate-500">
            Địa chỉ OmniRoute đang chạy. Mặc định máy cục bộ: <code className="bg-slate-100 px-1 py-0.5 rounded">http://127.0.0.1:20128/v1</code> hoặc domain Cloud của bạn.
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-indigo-600" />
            2. Khóa xác thực (API Key) *
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-omniroute-your-key"
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-[11px] text-slate-500">
            Khóa API cấp bởi OmniRoute hoặc OpenAI (vd: <code className="bg-slate-100 px-1 py-0.5 rounded">sk-omniroute-...</code>).
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            3. Tên Mô hình AI (Module / Model Name) *
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
              required
            />

            {/* Quick model selectors */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              {["gpt-4o-mini", "gemini-2.5-flash", "claude-3-5-sonnet", "deepseek-chat"].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setModel(m)}
                  className={`text-[10px] font-bold px-2.5 py-2 rounded-xl border transition ${
                    model === m
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Mô hình AI OmniRoute sẽ sử dụng để sinh văn bản (ví dụ: <code className="bg-slate-100 px-1 py-0.5 rounded">gpt-4o-mini</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">gemini-2.5-flash</code>, v.v.).
          </p>
        </div>

        {/* Help box */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> Hướng dẫn nhanh OmniRoute:
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-indigo-800">
            <li>Bạn có thể nhập các thông số trực tiếp tại giao diện Web này mà không cần sửa file server hay khởi động lại web.</li>
            <li>Bấm <strong>"⚡ Thử kết nối AI"</strong> ở góc trên bên phải để kiểm tra đường truyền thực tế.</li>
            <li>Khi bấm <strong>"💾 Lưu Cấu Hình"</strong>, toàn bộ các tính năng AI trên web sẽ tự động sử dụng cấu hình mới nhất!</li>
          </ul>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Đang lưu..." : "💾 Lưu Cấu Hình"}
          </button>
        </div>
      </form>
    </div>
  );
}
