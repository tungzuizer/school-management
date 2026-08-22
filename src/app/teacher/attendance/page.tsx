"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMyClasses,
  getClassStudents,
  getAttendanceByDateAndPeriod,
  saveAttendance,
  ClassSubjectOption,
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
  AlertCircle,
  BookOpen,
  Info,
  Sparkles,
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

const PERIOD_TIMES: Record<number, string> = {
  1: "07:00 - 07:45",
  2: "07:50 - 08:35",
  3: "08:50 - 09:35",
  4: "09:40 - 10:25",
  5: "13:00 - 13:45",
  6: "13:50 - 14:35",
  7: "14:50 - 15:35",
  8: "15:40 - 16:25",
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassSubjectOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [scheduledSubjectInfo, setScheduledSubjectInfo] = useState<{ id: string; name: string } | null>(null);
  const [scheduledTeacherName, setScheduledTeacherName] = useState<string | null>(null);

  const { showToast, ToastComponent } = useToast();

  // Load classes initially
  useEffect(() => {
    getMyClasses().then((data) => {
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].classId);
        if (data[0].subjects.length > 0) {
          setSelectedSubjectId(data[0].subjects[0].id);
        }
      }
    });
  }, []);

  const selectedClass = classes.find((c) => c.classId === selectedClassId);

  // Load students & attendance session info
  const loadData = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);

    try {
      const [studentsData, sessionInfo] = await Promise.all([
        getClassStudents(selectedClassId),
        getAttendanceByDateAndPeriod(selectedClassId, selectedDate, selectedPeriod),
      ]);

      setStudents(studentsData as unknown as StudentItem[]);
      setIsLocked(sessionInfo.isLocked);
      setLockedAt(sessionInfo.lockedAt);
      setScheduledSubjectInfo(sessionInfo.scheduledSubject);
      setScheduledTeacherName(sessionInfo.scheduledTeacherName || null);

      // If timetable has a subject for this slot, auto-select it
      if (sessionInfo.scheduledSubject) {
        setSelectedSubjectId(sessionInfo.scheduledSubject.id);
      }

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
      console.error(err);
      showToast("Lỗi tải thông tin điểm danh", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedDate, selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    if (!selectedClassId) return;
    if (isLocked) {
      showToast("Tiết học này đã được điểm danh và khóa sổ. Không thể sửa!", "error");
      return;
    }

    const currentSubj = selectedClass?.subjects.find((s) => s.id === selectedSubjectId);

    const confirmMsg = `XÁC NHẬN ĐIỂM DANH LỚP ${selectedClass?.className}?\n\n• Ngày: ${selectedDate}\n• Tiết: Tiết ${selectedPeriod} (${PERIOD_TIMES[selectedPeriod]})\n• Môn: ${currentSubj?.name || "Bộ môn"}\n\n⚠️ Lưu ý: Sau khi lưu, thông tin điểm danh của tiết này sẽ bị KHÓA VĨNH VIỄN và không thể tự đổi lại. Bạn có chắc chắn muốn hoàn tất?`;

    if (!confirm(confirmMsg)) return;

    setSaving(true);
    const recordsList = Object.values(records);

    const result = await saveAttendance(
      selectedClassId,
      selectedDate,
      selectedPeriod,
      selectedSubjectId,
      recordsList
    );

    setSaving(false);

    if (result.success) {
      showToast("Đã khóa và lưu điểm danh thành công!");
      setIsLocked(true);
      loadData();
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
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Điểm Danh Theo Tiết Học
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-[11px] font-bold">
                Mỗi Tiết / Môn 1 Lần Duy Nhất
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sổ Điểm Danh Giảng Dạy</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Ghi nhận hiện diện theo tiết, khớp thời khóa biểu & khóa tự động ngay sau khi điểm danh xong.
            </p>
          </div>

          {!isLocked && students.length > 0 && (
            <button
              onClick={setAllPresent}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-extrabold transition-all backdrop-blur-md shadow-xs active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Đánh dấu tất cả Có Mặt</span>
            </button>
          )}
        </div>
      </div>

      {/* Lock Notification Banner if already taken */}
      {isLocked && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl p-4 shadow-xs flex items-start gap-3">
          <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-rose-900 flex items-center gap-2">
              <span>ĐÃ ĐIỂM DANH & KHÓA SỔ TIẾT HỌC NÀY</span>
              {lockedAt && (
                <span className="text-xs font-normal text-rose-700">
                  (Đã lưu lúc {new Date(lockedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
            </h3>
            <p className="text-xs text-rose-800">
              Tiết <strong>{selectedPeriod}</strong> ngày <strong>{selectedDate}</strong> của lớp{" "}
              <strong>{selectedClass?.className}</strong> đã được lưu thành công. Mỗi tiết học chỉ được phép điểm danh 1 lần duy nhất để bảo đảm dữ liệu minh bạch.
            </p>
          </div>
        </div>
      )}

      {/* Filters Toolbar Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              1. Chọn Lớp Dạy *
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {classes.length === 0 && <option value="">Chưa có lớp dạy</option>}
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  Lớp {c.className} (Khối {c.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              2. Ngày Điểm Danh *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Period Select (Mandatory Tiết 1..8) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              3. Tiết Học (1 - 8) *
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-500 rounded-xl text-xs font-extrabold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Tiết {p} ({PERIOD_TIMES[p]})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              4. Môn Học *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {selectedClass?.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  Môn {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timetable match banner */}
        {scheduledSubjectInfo && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Thời khóa biểu: Tiết {selectedPeriod} là Môn {scheduledSubjectInfo.name}</span>
              {scheduledTeacherName && <span className="text-slate-600 font-normal">(GV: {scheduledTeacherName})</span>}
            </span>
            <span className="text-[11px] bg-indigo-200 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
              Đã tự động khớp TKB
            </span>
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
              Danh Sách Học Sinh — Lớp {selectedClass?.className} (Tiết {selectedPeriod})
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
                      Đang tải danh sách học sinh...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 font-semibold">
                    {classes.length === 0 ? "Bạn chưa được phân công lớp nào." : "Lớp hiện chưa có học sinh."}
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
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                currentStatus === opt.value
                                  ? opt.activeGlow
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              } ${isLocked ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
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
      {students.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 italic">
            {isLocked ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Tiết học đã điểm danh và bị khóa sổ.
              </span>
            ) : (
              <span>⚠️ Kiểm tra kỹ trước khi bấm lưu. Tiết học sẽ bị khóa ngay sau khi lưu.</span>
            )}
          </div>

          {isLocked ? (
            <div className="px-6 py-3 bg-slate-200 text-slate-600 rounded-2xl font-extrabold text-sm flex items-center gap-2 cursor-not-allowed">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Đã Điểm Danh Tiết Này (Đã Khóa)</span>
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Đang lưu và khóa..." : `Xác Nhận & Khóa Điểm Danh Tiết ${selectedPeriod}`}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
