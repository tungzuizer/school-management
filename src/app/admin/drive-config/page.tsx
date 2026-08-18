"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSchoolDriveConfig, updateSharedDriveUrl,
  getLessonPlanPeriods, createLessonPlanPeriod, togglePeriodActive, deletePeriod,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import { HardDrive, Plus, Calendar, Trash2, Power, ExternalLink } from "lucide-react";

interface Period {
  id: string; label: string; startDate: string; deadline: string; isActive: boolean;
}

export default function DriveConfigPage() {
  const [driveUrl, setDriveUrl] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // New period form
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true);
    const [config, ps] = await Promise.all([getSchoolDriveConfig(), getLessonPlanPeriods()]);
    if (config) { setDriveUrl(config.sharedDriveUrl || ""); setSchoolName(config.name); }
    setPeriods(ps as unknown as Period[]);
    setInitialLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveDriveUrl = async () => {
    setSaving(true);
    const res = await updateSharedDriveUrl(driveUrl);
    setSaving(false);
    showToast(res.success ? "Đã lưu link Drive" : (res.error || "Lỗi"), res.success ? "success" : "error");
  };

  const handleCreatePeriod = async () => {
    if (!newLabel.trim() || !newStart || !newDeadline) {
      showToast("Vui lòng điền đầy đủ thông tin", "error"); return;
    }
    const res = await createLessonPlanPeriod({ label: newLabel, startDate: newStart, deadline: newDeadline });
    if (res.success) { showToast("Đã tạo kỳ nộp", "success"); setShowForm(false); setNewLabel(""); loadData(true); }
    else showToast(res.error || "Lỗi", "error");
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-5xl relative">
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-500 font-medium flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {ToastComponent}

      <div className="flex items-center gap-3">
        <HardDrive className="w-7 h-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình Google Drive & Kỳ Nộp Giáo Án</h1>
          <p className="text-sm text-gray-500">{schoolName}</p>
        </div>
      </div>

      {/* Drive URL */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-blue-600" /> Link Google Drive dùng chung của Trường
        </h2>
        <p className="text-xs text-gray-500">Tất cả giáo viên sẽ upload file giáo án vào thư mục Drive này. Mỗi trường chỉ 1 link.</p>
        <div className="flex gap-3">
          <input type="url" value={driveUrl} onChange={e => setDriveUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          <button onClick={saveDriveUrl} disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
        {driveUrl && (
          <a href={driveUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <ExternalLink className="w-3 h-3" /> Mở Drive
          </a>
        )}
      </div>

      {/* Lesson Plan Periods */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> Kỳ Nộp Giáo Án
          </h2>
          <button onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Tạo kỳ nộp
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-3">Mỗi kỳ nộp có hạn cuối (deadline). Hệ thống tự kiểm tra GV chưa nộp / nộp muộn.</p>

        {showForm && (
          <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tên kỳ nộp</label>
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="VD: Tháng 9/2025" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ngày bắt đầu</label>
                <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hạn nộp</label>
                <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <button onClick={handleCreatePeriod} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">Tạo kỳ nộp</button>
          </div>
        )}

        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Tên kỳ</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Bắt đầu</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Hạn nộp</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {periods.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">Chưa có kỳ nộp nào</td></tr>
            ) : periods.map(p => {
              const isOverdue = new Date(p.deadline) < new Date();
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.label}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmt(p.startDate)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmt(p.deadline)} {isOverdue && <span className="text-red-500 font-semibold">(Đã hết hạn)</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Đang hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <button onClick={async () => { await togglePeriodActive(p.id, !p.isActive); loadData(); }}
                      className="p-1.5 rounded hover:bg-gray-200" title={p.isActive ? "Tắt" : "Bật"}>
                      <Power className={`w-3.5 h-3.5 ${p.isActive ? "text-green-600" : "text-gray-400"}`} />
                    </button>
                    <button onClick={async () => { await deletePeriod(p.id); loadData(); showToast("Đã xóa", "success"); }}
                      className="p-1.5 rounded hover:bg-red-100" title="Xóa">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
