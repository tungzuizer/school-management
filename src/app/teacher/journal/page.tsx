"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getJournalMetadata,
  getJournalEntries,
  saveJournalEntry,
  confirmJournalEntry,
  confirmAllJournalEntriesForDate,
  deleteJournalEntry,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  Info,
  Calendar,
  BookOpen,
  User,
  ListRestart,
  Save,
  X,
  FileSpreadsheet
} from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  isHomeroom: boolean;
}

interface SubjectOption {
  id: string;
  name: string;
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
  homeroomTeacherId: string | null;
}

export default function ClassJournalPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<JournalEntry> | null>(null);
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formLessonTitle, setFormLessonTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAbsentees, setFormAbsentees] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const [initializing, setInitializing] = useState(true);

  // Load initial options
  useEffect(() => {
    let mounted = true;
    getJournalMetadata()
      .then((data) => {
        if (!mounted) return;
        const fetchedClasses = data.classes || [];
        const fetchedSubjects = data.subjects || [];
        setClasses(fetchedClasses);
        setSubjects(fetchedSubjects);
        setTeacherId(data.teacherId);
        if (fetchedClasses.length > 0) {
          const homeroom = fetchedClasses.find((c) => c.isHomeroom);
          setSelectedClass(homeroom ? homeroom.id : fetchedClasses[0].id);
        }
        if (fetchedSubjects.length > 0) {
          setFormSubjectId(fetchedSubjects[0].id);
        }
      })
      .catch((err) => {
        console.error("getJournalMetadata error:", err);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadJournalEntries = useCallback(async () => {
    if (!selectedClass || !selectedDate) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getJournalEntries(selectedClass, selectedDate);
      setEntries(data as any);
    } catch (e: any) {
      console.error("loadJournalEntries error:", e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (!initializing) {
      loadJournalEntries();
    }
  }, [initializing, loadJournalEntries]);

  const handleOpenAddModal = (period: number) => {
    setEditingEntry(null);
    setFormPeriod(period);
    if (subjects.length > 0) {
      setFormSubjectId(subjects[0].id);
    }
    setFormLessonTitle("");
    setFormContent("");
    setFormAbsentees("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormPeriod(entry.period);
    setFormSubjectId(entry.subjectId);
    setFormLessonTitle(entry.lessonTitle);
    setFormContent(entry.content);
    setFormAbsentees(entry.absentees);
    setFormNotes(entry.notes);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !formSubjectId) {
      showToast("Nhập thiếu thông tin lớp học hoặc môn học", "error");
      return;
    }

    setFormSaving(true);
    try {
      const res = await saveJournalEntry({
        id: editingEntry?.id,
        classId: selectedClass,
        subjectId: formSubjectId,
        dateStr: selectedDate,
        period: formPeriod,
        lessonTitle: formLessonTitle,
        content: formContent,
        absentees: formAbsentees,
        notes: formNotes,
      });

      if (res.success) {
        showToast(editingEntry?.id ? "Cập nhật bài dạy thành công" : "Ghi sổ đầu bài thành công", "success");
        setIsModalOpen(false);
        loadJournalEntries();
      } else {
        showToast(res.error || "Giao dịch không thành công", "error");
      }
    } catch (err: any) {
      showToast("Đã xảy ra lỗi hệ thống", "error");
    } finally {
      setFormSaving(false);
    }
  };

  const handleConfirmSingle = async (entryId: string) => {
    try {
      const res = await confirmJournalEntry(entryId);
      if (res.success) {
        showToast("GVCN đã ký xác nhận tiết học thành công", "success");
        loadJournalEntries();
      } else {
        showToast(res.error || "Lỗi khi cập nhật xác nhận", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const handleConfirmAll = async () => {
    if (!confirm("Xác nhận tất cả các tiết học của ngày này?")) return;
    try {
      const res = await confirmAllJournalEntriesForDate(selectedClass, selectedDate);
      if (res.success) {
        showToast("Xác nhận toàn bộ tiết học thành công", "success");
        loadJournalEntries();
      } else {
        showToast(res.error || "Không thể xác nhận đồng loạt", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa bài ghi tiết học này khỏi sổ đầu bài?")) return;
    try {
      const res = await deleteJournalEntry(entryId);
      if (res.success) {
        showToast("Xóa bài dạy thành công", "success");
        loadJournalEntries();
      } else {
        showToast(res.error || "Lỗi thao tác xóa", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const currentClassObj = classes.find((c) => c.id === selectedClass);
  const isClassHomeroomTeacher = currentClassObj?.isHomeroom || false;

  // Periods list 1 to 8 (Standard Vietnamese school periods)
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {ToastComponent}

      {/* Header section */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Sổ Đầu Bài</h1>
        <p className="text-xs text-red-700 mt-1">Ghi nhận thông tin bài học và đánh giá hoạt động học tập hàng ngày</p>
      </div>

      {/* Easy mode notification bar */}
      {isEasyMode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-emerald-600" />
          <div className="space-y-1">
            <p className="font-semibold">Hệ thống trợ giúp (Dành cho Giáo viên):</p>
            <p>1. Chọn Lớp học và Ngày học ở khung phía dưới.</p>
            <p>2. Ấn nút "Ghi bài dạy" tại tiết tương ứng để cập nhật nội dung bài dạy.</p>
            <p>3. Chỉ có giáo viên trực tiếp đứng lớp mới có thể sửa hoặc xóa bài dạy trước khi GVCN ký xác nhận.</p>
            <p>4. Nếu là GVCN của lớp này, thầy/cô sẽ thấy nút "Ký duyệt" để phê duyệt sổ đầu bài cuối ngày.</p>
          </div>
        </div>
      )}

      {/* Selectors block */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-medium"
            >
              <option value="" disabled>--- Chọn lớp ---</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isHomeroom ? "(Lớp CN)" : ""}
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
              className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Global Homeroom Sign-off */}
        {isClassHomeroomTeacher && entries.length > 0 && (
          <button
            onClick={handleConfirmAll}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-250 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Ký Duyệt Tất Cả Các Tiết Trong Ngày
          </button>
        )}
      </div>

      {/* Periods list */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide px-1">Danh sách tiết học trong ngày</h2>
        
        {initializing || loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl p-6">
            <ListRestart className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-red-700">Đang tải sổ đầu bài...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl p-6 space-y-1">
            <p className="text-sm font-semibold text-slate-700">Chưa có lớp học nào trong hệ thống</p>
            <p className="text-xs text-red-700">Vui lòng liên hệ Quản trị viên để cập nhật danh sách lớp.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((periodNum) => {
              const entry = entries.find((e) => e.period === periodNum);
              return (
                <div
                  key={periodNum}
                  className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl transition-all p-4 ${
                    entry
                      ? entry.isConfirmed
                        ? "border-emerald-100 bg-emerald-50/10"
                        : "border-blue-105"
                      : "border-dashed border-gray-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Period Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${
                        entry
                          ? entry.isConfirmed
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-blue-100 text-blue-700"
                          : "bg-gray-150 text-red-700"
                      }`}>
                        T{periodNum}
                      </span>
                      <div>
                        {entry ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-slate-800">{entry.subjectName}</span>
                            {entry.isConfirmed ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5 stroke-[3]" /> Đã ký
                              </span>
                            ) : (
                              <span className="text-[11px] bg-gray-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                Chờ ký duyệt
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-red-700">Tiết học trống</span>
                        )}
                        {entry && (
                          <div className="text-xs text-red-700 flex items-center gap-1 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                            <span>GV: {entry.teacherName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {entry ? (
                        <>
                          {/* If current teacher is homeroom, show sign button */}
                          {isClassHomeroomTeacher && !entry.isConfirmed && (
                            <button
                              onClick={() => handleConfirmSingle(entry.id)}
                              className="p-2 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-emerald-600 transition"
                              title="Ký duyệt tiết này"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {/* Show edit and delete if not confirmed and is owner (or homeroom teacher) */}
                          {!entry.isConfirmed && (entry.teacherId === teacherId || isClassHomeroomTeacher) && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(entry)}
                                className="p-2 border border-gray-200 hover:bg-slate-50 rounded-lg text-red-700 hover:text-blue-600 transition"
                                title="Sửa bài ghi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {entry.teacherId === teacherId && (
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-2 border border-gray-200 hover:bg-red-50 rounded-lg text-red-700 hover:text-red-500 transition"
                                  title="Xóa bài ghi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenAddModal(periodNum)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-105 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ghi bài
                        </button>
                      )}
                    </div>
                  </div>

                  {entry && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="font-bold text-red-700 mr-1">Tên bài học:</span>
                        <span className="font-semibold text-gray-805">{entry.lessonTitle}</span>
                      </div>
                      {entry.content && (
                        <div>
                          <span className="font-bold text-red-700 mr-1">Nội dung học:</span>
                          <span>{entry.content}</span>
                        </div>
                      )}
                      {entry.absentees && (
                        <div className="text-red-650 bg-red-50/50 px-2 py-1 rounded-lg inline-block">
                          <span className="font-bold mr-1">Vắng:</span>
                          <span>{entry.absentees}</span>
                        </div>
                      )}
                      {entry.notes && (
                        <div className="bg-yellow-50/55 text-yellow-800 border border-yellow-100 px-2 py-1 rounded-lg">
                          <span className="font-bold mr-1">Nhận xét bài kiểm tra/Ghi chú:</span>
                          <span>{entry.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Modal dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-gray-100 shadow-2xl p-5 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-red-700 hover:bg-gray-100 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-900 text-lg mb-2">
              {editingEntry ? "Cập Nhật Bài Dạy" : `Ghi Sổ Đầu Bài`}
            </h3>
            <p className="text-xs text-red-700 mb-4">Các thông tin được lưu trực tiếp vào hệ thống sổ đầu bài của lớp.</p>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Môn học</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none"
                  required
                >
                  <option value="" disabled>--- Chọn môn học ---</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Tiết học</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none font-medium"
                  required
                  disabled={!!editingEntry}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Tên bài dạy / Chủ đề</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đại số: Bài 1 - Phép cộng phân số"
                  value={formLessonTitle}
                  onChange={(e) => setFormLessonTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Nội dung chi tiết (Không bắt buộc)</label>
                <textarea
                  rows={2}
                  placeholder="Các nội dung bài giảng chính, bài thực hành..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Học sinh vắng (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A (P), Trần Thị B (KP)"
                  value={formAbsentees}
                  onChange={(e) => setFormAbsentees(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-red-700 uppercase mb-1">Nhận xét bài / Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Học sinh làm bài kiểm tra 15 phút tốt, lớp học sôi nổi"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 text-slate-800 text-sm rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-red-700 hover:bg-slate-50 active:scale-95 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-750 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  {formSaving ? "Đang lưu..." : editingEntry ? "Cập nhật" : "Lưu sổ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
