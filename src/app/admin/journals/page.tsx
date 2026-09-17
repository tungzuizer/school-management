/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin journals route `/admin/journals`.
 * 2. Affected APIs: Server actions `getAdminJournalMetadata`, `getAdminJournalEntries`, `deleteAdminJournalEntry`, `confirmAdminJournalEntry`.
 * 3. Schema: Prisma `ClassRoom`, `ClassJournalEntry`, `School`, `User`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Chuẩn hóa toàn bộ giao diện các trang Quản trị cho SuperAdmin.
 */

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
  Building2,
  BookOpen,
  Calendar,
} from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  schoolId?: string | null;
  schoolName?: string;
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
  const [schools, setSchools] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
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
        const fetchedClasses = (data.classes || []) as ClassOption[];
        const fetchedSchools = (data.schools || []) as any;
        setClasses(fetchedClasses);
        setSchools(fetchedSchools);
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

  const visibleClasses = classes.filter((c) =>
    selectedSchool === "ALL" ? true : c.schoolId === selectedSchool
  );

  const selectedClassObj = classes.find((c) => c.id === selectedClass);
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {ToastComponent}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Giám Sát Sổ Đầu Bài Toàn Trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi, ký duyệt thay thế hoặc điều chỉnh sổ đầu bài của tất cả các lớp trong toàn hệ thống
          </p>
        </div>
        {schools.length > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedSchool}
              onChange={(e) => {
                const newSchool = e.target.value;
                setSelectedSchool(newSchool);
                const nextClasses = classes.filter((c) =>
                  newSchool === "ALL" ? true : c.schoolId === newSchool
                );
                if (nextClasses.length > 0) {
                  setSelectedClass(nextClasses[0].id);
                } else {
                  setSelectedClass("");
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các trường</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isEasyMode && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex gap-3 text-indigo-950 text-xs sm:text-sm shadow-2xs">
          <Info className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
          <div className="space-y-1 bg-transparent">
            <p className="font-bold text-indigo-950">Hướng dẫn dành cho Ban Giám Hiệu / SuperAdmin:</p>
            <p>1. Chọn trường học, lớp học và ngày cần kiểm tra từ thanh công cụ phía dưới.</p>
            <p>2. Hệ thống sẽ hiển thị các tiết học tiêu chuẩn và trạng thái ghi bài của giáo viên bộ môn.</p>
            <p>3. Trong trường hợp Giáo viên chủ nhiệm (GVCN) gặp sự cố kỹ thuật hoặc vắng mặt, Ban giám hiệu có thể click vào nút kiểm duyệt (Ký thay) để khóa tiết học.</p>
            <p>4. Ban Giám Hiệu cũng có quyền xóa bài ghi nếu phát hiện thông tin không chính xác hoặc trùng lặp.</p>
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Lớp học cần giám sát</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="" disabled>--- Chọn lớp ---</option>
              {visibleClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} {c.schoolName ? `(${c.schoolName})` : ""} - GVCN: {c.homeroomTeacherName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Ngày học</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <div className="text-xs sm:text-sm text-slate-500 pb-2.5">
            GVCN lớp: <span className="font-bold text-slate-800">{selectedClassObj?.homeroomTeacherName || "Chưa phân công"}</span>
          </div>
        </div>
      </div>

      {/* Periods list */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex justify-between items-center">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Sổ đầu bài ngày {selectedDate}
          </h2>
          <span className="text-xs text-slate-400 font-medium">Tiêu chuẩn: 8-10 tiết học/ngày</span>
        </div>

        {initializing || loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <ListRestart className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs sm:text-sm text-slate-400 font-semibold">Đang tải sổ đầu bài...</p>
          </div>
        ) : visibleClasses.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm font-semibold">Chưa có lớp học nào trong hệ thống hoặc trường đã chọn</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng tạo lớp học trong trang Quản lý trường học trước.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {periods.map((periodNum) => {
              const entry = entries.find((e) => e.period === periodNum);
              return (
                <div
                  key={periodNum}
                  className={`p-4 sm:p-5 transition-all ${
                    entry
                      ? entry.isConfirmed
                        ? "bg-emerald-50/20 hover:bg-emerald-50/30"
                        : "bg-indigo-50/20 hover:bg-indigo-50/30"
                      : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Period metadata */}
                    <div className="flex items-start gap-3">
                      <span className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-2xs ${
                        entry
                          ? entry.isConfirmed
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : "bg-slate-100 text-slate-400 border border-dashed border-slate-200"
                      }`}>
                        T{periodNum}
                      </span>
                      <div>
                        {entry ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm sm:text-base font-bold text-slate-900">{entry.subjectName}</span>
                              <span className="text-xs text-slate-500 font-medium">| GV dạy: <strong className="text-slate-800">{entry.teacherName}</strong></span>
                              {entry.isConfirmed ? (
                                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Đã xác nhận
                                </span>
                              ) : (
                                <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-800">
                              Bài học: {entry.lessonTitle}
                            </div>
                            {entry.content && (
                              <p className="text-xs sm:text-sm text-slate-600">
                                <span className="font-semibold text-slate-400">Nội dung chính:</span> {entry.content}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1 text-xs">
                              {entry.absentees && (
                                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-medium">
                                  Vắng: {entry.absentees}
                                </span>
                              )}
                              {entry.notes && (
                                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                                  Ghi chú: {entry.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-slate-400 italic">Trống - Không có bài ghi dạy cho tiết học này</span>
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
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Ký duyệt thay
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer shadow-2xs"
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
