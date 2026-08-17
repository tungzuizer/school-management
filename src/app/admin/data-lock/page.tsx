"use client";

import { useEffect, useState, useCallback } from "react";
import { getDataLocks, toggleDataLock } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { Lock, Unlock, ShieldCheck, Plus } from "lucide-react";

const LOCK_TYPES: Record<string, string> = {
  GRADE_HK1: "Sổ điểm - Học kỳ 1",
  GRADE_HK2: "Sổ điểm - Học kỳ 2",
  GRADE_FULL_YEAR: "Sổ điểm - Cả năm",
  ATTENDANCE_HK1: "Điểm danh - Học kỳ 1",
  ATTENDANCE_HK2: "Điểm danh - Học kỳ 2",
  JOURNAL_HK1: "Sổ đầu bài - Học kỳ 1",
  JOURNAL_HK2: "Sổ đầu bài - Học kỳ 2",
  CONDUCT_HK1: "Hạnh kiểm - Học kỳ 1",
  CONDUCT_HK2: "Hạnh kiểm - Học kỳ 2",
};

interface DataLockRow {
  id: string;
  lockType: string;
  periodLabel: string;
  isLocked: boolean;
  lockedByName: string | null;
  lockedAt: string | null;
  unlockedByName: string | null;
  unlockedAt: string | null;
  reason: string | null;
}

export default function DataLockPage() {
  const [locks, setLocks] = useState<DataLockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // New lock form
  const [showForm, setShowForm] = useState(false);
  const [newLockType, setNewLockType] = useState("");
  const [newPeriod, setNewPeriod] = useState("2026-2027");

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getDataLocks();
    setLocks(data as unknown as DataLockRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (lockType: string, periodLabel: string, lock: boolean) => {
    const key = `${lockType}::${periodLabel}`;
    setToggling(key);
    const reason = lock
      ? "Ban Giám hiệu khóa sổ cuối kỳ"
      : undefined;
    const res = await toggleDataLock(lockType, periodLabel, lock, reason);
    setToggling(null);
    if (res.success) {
      showToast(lock ? "Đã khóa sổ thành công" : "Đã mở khóa thành công", "success");
      loadData();
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleCreateLock = async () => {
    if (!newLockType) {
      showToast("Vui lòng chọn loại sổ cần khóa", "error");
      return;
    }
    const periodLabel = newPeriod.trim() || "2026-2027";
    const res = await toggleDataLock(newLockType, periodLabel, true, "Tạo bản ghi khóa sổ mới");
    if (res.success) {
      showToast("Đã tạo và khóa sổ thành công", "success");
      setShowForm(false);
      setNewLockType("");
      loadData();
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khóa sổ Dữ liệu</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Thêm Khóa sổ
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <strong>Lưu ý:</strong> Khi sổ điểm / sổ đầu bài bị khóa, Giáo viên sẽ không thể chỉnh sửa dữ liệu của kỳ đã khóa. Chỉ Hiệu trưởng / Quản trị viên mới có quyền mở khóa.
      </div>

      {/* New Lock Form */}
      {showForm && (
        <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Tạo bản ghi Khóa sổ mới</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại sổ</label>
              <select
                value={newLockType}
                onChange={(e) => setNewLockType(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Chọn loại sổ —</option>
                {Object.entries(LOCK_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Niên khóa / Kỳ</label>
              <input
                type="text"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                placeholder="VD: 2026-2027"
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-40"
              />
            </div>
            <button
              onClick={handleCreateLock}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Tạo & Khóa
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Loại sổ</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Niên khóa</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Người khóa</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : locks.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có bản ghi khóa sổ nào</td></tr>
            ) : (
              locks.map((l) => {
                const key = `${l.lockType}::${l.periodLabel}`;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {LOCK_TYPES[l.lockType] || l.lockType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{l.periodLabel}</td>
                    <td className="px-6 py-4 text-center">
                      {l.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <Unlock className="w-3 h-3" /> Mở
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {l.isLocked ? (l.lockedByName || "—") : (l.unlockedByName || "—")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {l.isLocked ? formatDate(l.lockedAt) : formatDate(l.unlockedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggle(l.lockType, l.periodLabel, !l.isLocked)}
                        disabled={toggling === key}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          l.isLocked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        } disabled:opacity-50`}
                      >
                        {toggling === key
                          ? "Đang xử lý..."
                          : l.isLocked
                          ? "Mở khóa"
                          : "Khóa sổ"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
