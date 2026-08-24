"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTeacherScheduleForDate,
  getClassStudents,
  getAttendanceByDateAndPeriod,
  saveAttendance,
  TeacherSlotOption,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle2,
  UserCheck,
  Users,
  ShieldCheck,
  Save,
  Calendar,
  Clock,
  Lock,
  BookOpen,
  Sparkles,
  MapPin,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";

interface StudentItem {
  id: string;
  studentCode?: string | null;
  user: { name: string };
}

interface AttendanceRecord {
  studentId: string;
  status: string;
  note: string;
}

const STATUS_OPTIONS = [
  {
    value: "PRESENT",
    label: "Có mặt",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    activeGlow: "ring-2 ring-emerald-500 bg-emerald-600 text-white font-bold",
  },
  {
    value: "ABSENT_EXCUSED",
    label: "Vắng CP",
    color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    activeGlow: "ring-2 ring-amber-500 bg-amber-600 text-white font-bold",
  },
  {
    value: "ABSENT_UNEXCUSED",
    label: "Vắng KP",
    color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    activeGlow: "ring-2 ring-rose-500 bg-rose-600 text-white font-bold",
  },
  {
    value: "LATE",
    label: "Đi trễ",
    color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    activeGlow: "ring-2 ring-orange-500 bg-orange-600 text-white font-bold",
  },
];

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<TeacherSlotOption[]>([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("");

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);

  const { showToast, ToastComponent } = useToast();

  // Load teacher's timetable slots when date changes
  const loadScheduleSlots = useCallback(async () => {
    setLoading(true);
    try {
      const scheduleSlots = await getTeacherScheduleForDate(selectedDate);
      setSlots(scheduleSlots);

      if (scheduleSlots.length > 0) {
        setSelectedSlotKey(scheduleSlots[0].slotKey);
      } else {
        setSelectedSlotKey("");
        setStudents([]);
      }
    } catch (err) {
      console.error("Error loading schedule slots:", err);
      showToast("Không thể tải ca dạy theo thời khóa biểu", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadScheduleSlots();
  }, [loadScheduleSlots]);

  const activeSlot = slots.find((s) => s.slotKey === selectedSlotKey);

  // Load students & attendance session info for active slot
  const loadSlotData = useCallback(async () => {
    if (!activeSlot) return;
    setLoading(true);

    try {
      const [studentsData, sessionInfo] = await Promise.all([
        getClassStudents(activeSlot.classId),
        getAttendanceByDateAndPeriod(activeSlot.classId, selectedDate, activeSlot.period),
      ]);

      setStudents(studentsData as unknown as StudentItem[]);
      setIsLocked(sessionInfo.isLocked);
      setLockedAt(sessionInfo.lockedAt);

      const recordsMap: Record<string, AttendanceRecord> = {};
      const existingMap = new Map((sessionInfo.existingData as any[]).map((a: any) => [a.studentId, a]));

      (studentsData as unknown as StudentItem[]).forEach((s) => {
        const existing = existingMap.get(s.id) as any;
        recordsMap[s.id] = {
          studentId: s.id,
          status: existing?.status || "PRESENT",
          note: existing?.note || "",
        };
      });

      setRecords(recordsMap);
    } catch (err) {
      console.error("Error loading slot attendance data:", err);
      showToast("Lỗi tải thông tin điểm danh ca dạy", "error");
    } finally {
      setLoading(false);
    }
  }, [activeSlot, selectedDate]);

  useEffect(() => {
    loadSlotData();
  }, [loadSlotData]);

  const updateStatus = (studentId: string, status: string) => {
    if (isLocked) return;
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const updateNote = (studentId: string, note: string) => {
    if (isLocked) return;
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], note } }));
  };

  const setAllPresent = () => {
    if (isLocked) return;
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status: "PRESENT" };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!activeSlot) return;
    if (isLocked) {
      showToast("Tiết học này đã được điểm danh và khóa sổ. Không thể sửa!", "error");
      return;
    }

    const confirmMsg = `XÁC NHẬN ĐIỂM DANH CA DẠY?\n\n• Lớp: ${activeSlot.className}\n• Ngày: ${selectedDate}\n• Tiết: ${activeSlot.periodLabel} (${activeSlot.periodTime})\n• Môn: ${activeSlot.subjectName}\n\n⚠️ Sau khi bấm Xác nhận, thông tin điểm danh cho tiết học này sẽ bị KHÓA VĨNH VIỄN và không thể điểm danh lại. Bạn có chắc chắn?`;

    if (!confirm(confirmMsg)) return;

    setSaving(true);
    const recordsList = Object.values(records);

    const result = await saveAttendance(
      activeSlot.classId,
      selectedDate,
      activeSlot.period,
      activeSlot.subjectId,
      recordsList
    );

    setSaving(false);

    if (result.success) {
      showToast("Đã lưu & khóa điểm danh ca dạy thành công!");
      setIsLocked(true);
      loadScheduleSlots();
    } else {
      showToast(result.error || "Lỗi khi lưu điểm danh", "error");
    }
  };

  const stats = Object.values(records).reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {ToastComponent}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-3xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" /> Khớp Lịch Giảng Dạy TKB
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[11px] font-bold">
                Đúng Ca / Lớp / Tiết Dạy 1 Lần Duy Nhất
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sổ Điểm Danh Giảng Dạy Theo Ca</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Giáo viên điểm danh đúng lớp & tiết được phân công trên Thời khóa biểu. Mỗi ca dạy chỉ điểm danh 1 lần.
            </p>
          </div>

          {!isLocked && activeSlot && students.length > 0 && (
            <button
              onClick={setAllPresent}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-extrabold transition-all backdrop-blur-md shadow-xs active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Đánh dấu tất cả Có Mặt</span>
            </button>
          )}
        </div>
      </div>

      {/* Date & Teaching Slot Selector Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>1. Chọn Ngày Giảng Dạy *</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Schedule Slots Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>2. Chọn Ca Dạy Theo Thời Khóa Biểu *</span>
              <span className="text-slate-400 font-normal">({slots.length} ca dạy tìm thấy)</span>
            </label>

            {slots.length === 0 ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn không có lịch dạy tiết nào vào ngày {selectedDate} trên Thời khóa biểu.</span>
              </div>
            ) : (
              <select
                value={selectedSlotKey}
                onChange={(e) => setSelectedSlotKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-600 rounded-xl text-xs font-extrabold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              >
                {slots.map((s) => (
                  <option key={s.slotKey} value={s.slotKey}>
                    {s.isLocked ? "🔒 [ĐÃ ĐIỂM DANH] " : "⚡ [CHƯA ĐIỂM DANH] "}
                    {s.periodLabel} ({s.periodTime}) — Lớp {s.className} (Môn {s.subjectName}
                    {s.room ? ` - ${s.room}` : ""})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selected Slot Information Card */}
        {activeSlot && (
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300 font-black text-sm">
                {activeSlot.periodLabel}
              </div>
              <div>
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <span>Lớp {activeSlot.className}</span>
                  <span className="text-emerald-400 font-semibold">• Môn {activeSlot.subjectName}</span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>Giờ dạy: {activeSlot.periodTime}</span>
                  {activeSlot.room && (
                    <span className="flex items-center gap-1 text-indigo-300">
                      <MapPin className="w-3 h-3" /> {activeSlot.room}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              {isLocked ? (
                <span className="px-3 py-1.5 bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Đã Khóa Điểm Danh
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Ca Dạy Đang Mở
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Sĩ số</p>
              <p className="text-base font-extrabold text-slate-900">{students.length}</p>
            </div>
          </div>

          {STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className="bg-white border border-slate-200 p-3.5 rounded-2xl flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${opt.color}`}>
                <span className="text-xs font-bold">{opt.label[0]}</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{opt.label}</p>
                <p className="text-base font-extrabold text-slate-900">{stats[opt.value] || 0}</p>
              </div>
            </div>
          ))}

          <div
            className={`p-3.5 rounded-2xl flex items-center gap-2 col-span-2 sm:col-span-1 border ${
              isLocked ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"
            }`}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500">Trạng thái</p>
              <p className={`text-xs font-extrabold ${isLocked ? "text-rose-800" : "text-emerald-800"}`}>
                {isLocked ? "Đã Khóa" : "Chưa Điểm Danh"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>
              Danh Sách Học Sinh Lớp {activeSlot?.className} — Ca Dạy {activeSlot?.periodLabel} (Môn {activeSlot?.subjectName})
            </span>
          </div>
          {isLocked && (
            <span className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold rounded-lg flex items-center gap-1">
              <Lock className="w-3 h-3" /> Đã Khóa
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-4 py-3.5 w-28">Mã HS</th>
                <th className="px-4 py-3.5">Họ & Tên Học Sinh</th>
                <th className="px-4 py-3.5 text-center w-72">Trạng Thái Hiện Diện</th>
                <th className="px-4 py-3.5">Ghi Chú / Lý Do Vắng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách học sinh ca dạy...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 font-semibold">
                    {slots.length === 0 ? "Bạn không có ca dạy nào vào ngày này." : "Lớp hiện chưa có học sinh."}
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => {
                  const currentStatus = records[s.id]?.status || "PRESENT";
                  const isAbsence = currentStatus !== "PRESENT";

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors hover:bg-slate-50 ${isAbsence ? "bg-rose-50/40" : ""}`}
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{s.studentCode || "—"}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.user.name}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              disabled={isLocked}
                              onClick={() => updateStatus(s.id, opt.value)}
                              className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-extrabold border transition-all ${
                                currentStatus === opt.value
                                  ? opt.activeGlow
                                  : "bg-slate-50 border-slate-200/90 text-slate-800 hover:bg-slate-100 hover:text-slate-950"
                              } ${isLocked ? "opacity-75 cursor-not-allowed" : "cursor-pointer active-press"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={records[s.id]?.note || ""}
                          onChange={(e) => updateNote(s.id, e.target.value)}
                          placeholder={isLocked ? "Không có ghi chú" : "Lý do vắng / Đi trễ..."}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button Bar */}
      {students.length > 0 && activeSlot && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 italic">
            {isLocked ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Ca dạy này đã được điểm danh và bị khóa sổ.
              </span>
            ) : (
              <span>⚠️ Kiểm tra kỹ sĩ số trước khi bấm lưu. Ca dạy sẽ bị khóa ngay sau khi điểm danh xong.</span>
            )}
          </div>

          {isLocked ? (
            <div className="px-6 py-3 bg-slate-200 text-slate-600 rounded-2xl font-extrabold text-sm flex items-center gap-2 cursor-not-allowed">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Đã Điểm Danh Ca Dạy Này (Đã Khóa)</span>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Đang lưu & khóa..." : `Xác Nhận & Khóa Điểm Danh ${activeSlot.periodLabel}`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
