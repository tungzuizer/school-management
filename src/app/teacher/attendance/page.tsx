"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyClasses, getClassStudents, getAttendanceByDate, saveAttendance } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, UserCheck, Users, ShieldCheck, Save, Calendar, Clock } from "lucide-react";

interface ClassOption {
  classId: string;
  className: string;
  gradeLevel: number;
}

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
  { value: "PRESENT", label: "Có mặt", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", activeGlow: "ring-2 ring-emerald-500 bg-emerald-600 text-white font-bold" },
  { value: "ABSENT_EXCUSED", label: "Vắng CP", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", activeGlow: "ring-2 ring-amber-500 bg-amber-600 text-white font-bold" },
  { value: "ABSENT_UNEXCUSED", label: "Vắng KP", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", activeGlow: "ring-2 ring-rose-500 bg-rose-600 text-white font-bold" },
  { value: "LATE", label: "Đi trễ", color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", activeGlow: "ring-2 ring-orange-500 bg-orange-600 text-white font-bold" },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    getMyClasses().then((data) => {
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].classId);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);

    const [studentsData, existingData] = await Promise.all([
      getClassStudents(selectedClass),
      getAttendanceByDate(selectedClass, selectedDate, selectedPeriod || undefined),
    ]);

    setStudents(studentsData as unknown as StudentItem[]);

    const recordsMap: Record<string, AttendanceRecord> = {};
    const existingMap = new Map(
      (existingData as any[]).map((a: any) => [a.studentId, a])
    );

    (studentsData as unknown as StudentItem[]).forEach((s) => {
      const existing = existingMap.get(s.id) as any;
      recordsMap[s.id] = {
        studentId: s.id,
        status: existing?.status || "PRESENT",
        note: existing?.note || "",
      };
    });

    setRecords(recordsMap);
    setHasExisting(existingData.length > 0);
    setLoading(false);
  }, [selectedClass, selectedDate, selectedPeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const updateNote = (studentId: string, note: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], note } }));
  };

  const setAllPresent = () => {
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => { updated[id] = { ...updated[id], status: "PRESENT" }; });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    const recordsList = Object.values(records);
    const result = await saveAttendance(
      selectedClass,
      selectedDate,
      selectedPeriod || null,
      recordsList
    );
    setSaving(false);
    if (result.success) {
      showToast("Lưu điểm danh thành công!");
      setHasExisting(true);
    } else {
      showToast(result.error || "Lỗi khi lưu", "error");
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
    <div className="space-y-6">
      {ToastComponent}
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Điểm danh Học sinh Lớp học
          </h1>
          <p className="text-xs text-slate-500 mt-1">Cập nhật sĩ số, trạng thái hiện diện và lý do vắng học tức thì.</p>
        </div>
        <button
          onClick={setAllPresent}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-extrabold transition-all duration-200 active-press cursor-pointer shadow-2xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đánh dấu tất cả Có Mặt</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Chọn Lớp Dạy</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
            >
              {classes.length === 0 && <option value="">Chưa có lớp</option>}
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  Lớp {c.className} (Khối {c.gradeLevel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Ngày Điểm Danh</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Tiết Học</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
            >
              <option value={0}>Điểm danh cả ngày</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                <option key={p} value={p}>Tiết {p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end">
            <span className="text-xs text-slate-500 font-medium italic">Tự động đồng bộ với Sổ chủ nhiệm & BGH</span>
          </div>
        </div>
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

          {hasExisting && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Trạng thái</p>
                <p className="text-xs font-extrabold text-emerald-800">Đã lưu dữ liệu</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                      Đang tải danh sách điểm danh...
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
                      className={`transition-colors hover:bg-slate-50 ${
                        isAbsence ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{s.studentCode || "—"}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.user.name}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => updateStatus(s.id, opt.value)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                currentStatus === opt.value
                                  ? opt.activeGlow
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <input
                          type="text"
                          value={records[s.id]?.note || ""}
                          onChange={(e) => updateNote(s.id, e.target.value)}
                          placeholder="Lý do vắng / Đi trễ / Ghi chú..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
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

      {students.length > 0 && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-extrabold text-sm shadow-md shadow-emerald-500/20 transition-all duration-200 active-press cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Đang lưu hệ thống..." : hasExisting ? "Cập Nhật Điểm Danh" : "Lưu Điểm Danh Lớp"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
