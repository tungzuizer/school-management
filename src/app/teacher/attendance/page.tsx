"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyClasses, getClassStudents, getAttendanceByDate, saveAttendance } from "./actions";
import { useToast } from "@/components/ui/Toast";

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
  { value: "PRESENT", label: "Có mặt", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "ABSENT_EXCUSED", label: "Vắng CP", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "ABSENT_UNEXCUSED", label: "Vắng KP", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "LATE", label: "Đi trễ", color: "bg-orange-100 text-orange-800 border-orange-300" },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0); // 0 = cả ngày
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Load teacher's classes
  useEffect(() => {
    getMyClasses().then((data) => {
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].classId);
    });
  }, []);

  // Load students & existing attendance when class/date/period changes
  const loadData = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);

    const [studentsData, existingData] = await Promise.all([
      getClassStudents(selectedClass),
      getAttendanceByDate(selectedClass, selectedDate, selectedPeriod || undefined),
    ]);

    setStudents(studentsData as unknown as StudentItem[]);

    // Build records map
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

  // Count statistics
  const stats = Object.values(records).reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Điểm danh</h1>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[160px]">
              {classes.length === 0 && <option value="">Chưa có lớp</option>}
              {classes.map((c) => (
                <option key={c.classId} value={c.classId}>
                  {c.className} (Khối {c.gradeLevel})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiết</label>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value={0}>Cả ngày</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                <option key={p} value={p}>Tiết {p}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={setAllPresent}
              className="px-3 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 text-sm font-medium">
              ✓ Tất cả có mặt
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {students.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
            <span className="text-sm text-gray-500">Sĩ số:</span>
            <span className="font-bold text-gray-900">{students.length}</span>
          </div>
          {STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${opt.color}`}>
              <span className="text-sm">{opt.label}:</span>
              <span className="font-bold">{stats[opt.value] || 0}</span>
            </div>
          ))}
          {hasExisting && (
            <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
              <span className="text-sm text-blue-700">✓ Đã có dữ liệu</span>
            </div>
          )}
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950/80 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-12">STT</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mã HS</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                {classes.length === 0 ? "Bạn chưa được phân công lớp nào" : "Lớp chưa có học sinh"}
              </td></tr>
            ) : (
              students.map((s, idx) => (
                <tr key={s.id} className={`hover:bg-slate-950/80 ${records[s.id]?.status !== "PRESENT" ? "bg-red-50/50" : ""}`}>
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.studentCode || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.user.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateStatus(s.id, opt.value)}
                          className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                            records[s.id]?.status === opt.value
                              ? `${opt.color} ring-2 ring-offset-1 ring-gray-400`
                              : "bg-slate-950/80 text-gray-400 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={records[s.id]?.note || ""}
                      onChange={(e) => updateNote(s.id, e.target.value)}
                      placeholder="Lý do..."
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Save button */}
      {students.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium text-lg shadow-sm"
          >
            {saving ? "Đang lưu..." : hasExisting ? "Cập nhật điểm danh" : "Lưu điểm danh"}
          </button>
        </div>
      )}
    </div>
  );
}
