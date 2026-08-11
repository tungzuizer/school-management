"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminJournalMetadata,
  getAdminJournalEntries,
  deleteAdminJournalEntry,
  confirmAdminJournalEntry,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  Check,
  Info,
  User,
  ListRestart,
  Trash2,
} from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  homeroomTeacherName: string;
}

interface JournalEntry {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: Date;
  dayOfWeek: number;
  period: number;
  lessonTitle: string;
  content: string;
  absentees: string;
  notes: string;
  isConfirmed: boolean;
  confirmedAt: Date | null;
}

export default function AdminJournalsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    let mounted = true;
    getAdminJournalMetadata()
      .then((data) => {
        if (!mounted) return;
        const fetchedClasses = data.classes || [];
        setClasses(fetchedClasses);
        if (fetchedClasses.length > 0) {
          setSelectedClass(fetchedClasses[0].id);
        }
      })
      .catch((err) => {
        console.error("getAdminJournalMetadata error:", err);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadEntries = useCallback(async () => {
    if (!selectedClass || !selectedDate) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAdminJournalEntries(selectedClass, selectedDate);
      setEntries(data as any);
    } catch (e: any) {
      console.error("loadEntries error:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (!initializing) {
      loadEntries();
    }
  }, [initializing, loadEntries]);

  const handleConfirm = async (entryId: string) => {
    try {
      const res = await confirmAdminJournalEntry(entryId);
      if (res.success) {
        showToast("Đã duyệt/ký nhận thay cho lớp học này", "success");
        loadEntries();
      } else {
        showToast(res.error || "Lỗi duyệt bài học", "error");
      }
    } catch (err) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Admin: Bạn chắc chắn muốn xóa bài ghi sổ đầu bài này của giáo viên? Hành động không thể hoàn tác.")) return;
    try {
      const res = await deleteAdminJournalEntry(entryId);
      if (res.success) {
        showToast("Xóa bài ghi thành công", "success");
        loadEntries();
      } else {
        showToast(res.error || "Lỗi xóa bài ghi", "error");
      }
    } catch (err) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const selectedClassObj = classes.find(c => c.id === selectedClass);
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {ToastComponent}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Giám Sát Sổ Đầu Bài</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, ký duyệt thay thế hoặc điều chỉnh sổ đầu bài của tất cả các lớp trong toàn trường
          </p>
        </div>
      </div>

      {isEasyMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-900 text-sm">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-1 bg-transparent">
            <p className="font-semibold">Hướng dẫn dành cho Ban Giám Hiệu / Admin:</p>
            <p>1. Chọn lớp học và ngày cần kiểm tra từ thanh công cụ phía dưới.</p>
            <p>2. Hệ thống sẽ hiển thị 8 tiết học tiêu chuẩn và trạng thái ghi bài của giáo viên bộ môn.</p>
            <p>3. Trong trường hợp Giáo viên chủ nhiệm (GVCN) gặp sự cố kỹ thuật hoặc vắng mặt, Ban giám hiệu có thể click vào nút kiểm duyệt (Ký thay) để khóa tiết học.</p>
            <p>4. Ban Giám Hiệu cũng có quyền tối cao để xóa bài ghi nếu phát hiện thông tin không chính xác hoặc trùng lặp.</p>
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Lớp học cần giám sát</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
            >
              <option value="" disabled>--- Chọn lớp ---</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} (GVCN: {c.homeroomTeacherName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Ngày học</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
            />
          </div>
          <div className="text-sm text-gray-500 pb-2.5">
            GVCN lớp: <span className="font-semibold text-gray-700">{selectedClassObj?.homeroomTeacherName || "Chưa phân công"}</span>
          </div>
        </div>
      </div>

      {/* Periods list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/75 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Sổ đầu bài ngày {selectedDate}
          </h2>
          <span className="text-xs text-gray-400">Tiêu chuẩn: 8 tiết học/ngày</span>
        </div>

        {initializing || loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <ListRestart className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-400">Đang tải sổ đầu bài...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-sm font-semibold">Chưa có lớp học nào trong hệ thống</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng tạo lớp học trong trang Quản lý trường học trước.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {periods.map((periodNum) => {
              const entry = entries.find((e) => e.period === periodNum);
              return (
                <div
                  key={periodNum}
                  className={`p-5 transition-all ${
                    entry
                      ? entry.isConfirmed
                        ? "bg-emerald-50/10 hover:bg-emerald-50/20"
                        : "bg-blue-50/5 hover:bg-blue-50/10"
                      : "hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Period metadata */}
                    <div className="flex items-start gap-3">
                      <span className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                        entry
                          ? entry.isConfirmed
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-450 border border-dashed border-gray-200"
                      }`}>
                        T{periodNum}
                      </span>
                      <div>
                        {entry ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-bold text-gray-805">{entry.subjectName}</span>
                              <span className="text-xs text-gray-400 font-medium">| GV dạy: {entry.teacherName}</span>
                              {entry.isConfirmed ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã xác nhận
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-700">
                              Bài học: {entry.lessonTitle}
                            </div>
                            {entry.content && (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-400">Nội dung chính:</span> {entry.content}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1 text-xs">
                              {entry.absentees && (
                                <span className="text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                                  Vắng: {entry.absentees}
                                </span>
                              )}
                              {entry.notes && (
                                <span className="text-amber-850 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                  Nhận xét/Ghi chú: {entry.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-400 italic">Trống - Không có bài ghi dạy cho tiết học này</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {entry && (
                        <>
                          {!entry.isConfirmed && (
                            <button
                              onClick={() => handleConfirm(entry.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Ký duyệt thay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition"
                            title="Xóa bài ghi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
