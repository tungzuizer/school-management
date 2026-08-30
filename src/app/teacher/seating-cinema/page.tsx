"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCinemaClassAndStudents,
  saveCinemaSeatingLayout,
  evaluateStudentSeatPoint,
  SeatStudent,
  EvaluationLog,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
  Sparkles,
  Award,
  Trophy,
  Clock,
  Save,
  Loader2,
  School,
  Zap,
  Trash2,
  Shuffle,
  Users,
  Check,
  BookOpen,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  Monitor,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  LayoutGrid,
} from "lucide-react";

interface SeatMapping {
  [seatKey: string]: string; // e.g. "A1": studentId
}

const ALL_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface PresetCriterion {
  id: string;
  label: string;
  points: number;
  category: string;
  badgeTitle: string;
  icon: keyof typeof ICON_MAP;
}

const ICON_MAP = {
  BookOpen,
  Sparkles,
  UserCheck,
  Award,
  Trophy,
  ShieldAlert,
  AlertTriangle,
};

const PRESET_CRITERIA: PresetCriterion[] = [
  { id: "1", label: "Tích cực phát biểu ý kiến trong giờ học", points: 2, category: "Học tập", badgeTitle: "Tích Cực Phát Biểu", icon: "Sparkles" },
  { id: "2", label: "Xây dựng bài xuất sắc, đóng góp ý tưởng mới", points: 3, category: "Học tập", badgeTitle: "Xây Dựng Bài Học", icon: "BookOpen" },
  { id: "3", label: "Tích cực hỗ trợ & giúp đỡ bạn học", points: 2, category: "Nếp sống", badgeTitle: "Hỗ Trợ Bạn Học", icon: "UserCheck" },
  { id: "4", label: "Bài tập chuẩn chỉnh, hoàn thành xuất sắc", points: 2, category: "Học tập", badgeTitle: "Bài Tập Tốt", icon: "Award" },
  { id: "5", label: "Năng nổ tham gia hoạt động chung của lớp", points: 3, category: "Phong trào", badgeTitle: "Sao Phong Trào", icon: "Trophy" },
  { id: "6", label: "Nhắc nhở về nếp sống / mất trật tự", points: -1, category: "Vi phạm", badgeTitle: "Nhắc Nhở Nếp Sống", icon: "ShieldAlert" },
  { id: "7", label: "Vi phạm nội quy lớp học", points: -2, category: "Vi phạm", badgeTitle: "Cảnh Báo Kỷ Luật", icon: "AlertTriangle" },
];

export default function CinemaSeatingPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; gradeLevel: number }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [students, setStudents] = useState<SeatStudent[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapping>({});
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLayout, setSavingLayout] = useState(false);

  // Layout Configuration state
  const [rowCount, setRowCount] = useState<number>(5);
  const [colCount, setColCount] = useState<number>(6);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Quick Evaluation Modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedSeatKey, setSelectedSeatKey] = useState<string>("");
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<SeatStudent | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState<PresetCriterion>(PRESET_CRITERIA[0]);
  const [customNote, setCustomNote] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // Seat Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetSeatKey, setTargetSeatKey] = useState<string>("");
  const [assignStudentId, setAssignStudentId] = useState<string>("");

  const { showToast, ToastComponent } = useToast();

  const rows = ALL_ROWS.slice(0, rowCount);
  const cols = Array.from({ length: colCount }, (_, i) => i + 1);

  const loadData = useCallback(async (classId?: string) => {
    setLoading(true);
    const res = await getCinemaClassAndStudents(classId);
    setClasses(res.classes);
    if (res.classRoom) {
      setSelectedClassId(res.classRoom.id);
    }
    setStudents(res.students);
    setLogs(res.logs);

    if (res.layoutJson) {
      try {
        const parsed = JSON.parse(res.layoutJson);
        if (parsed.rows && typeof parsed.rows === "number") setRowCount(Math.min(8, Math.max(3, parsed.rows)));
        if (parsed.cols && typeof parsed.cols === "number") setColCount(Math.min(10, Math.max(4, parsed.cols)));
        if (parsed.seats) {
          setSeatMap(parsed.seats);
        }
      } catch {
        setSeatMap({});
      }
    } else if (res.students && res.students.length > 0) {
      // Map initial students into seats
      const initialMap: SeatMapping = {};
      let idx = 0;
      const defaultRows = ALL_ROWS.slice(0, 5);
      const defaultCols = [1, 2, 3, 4, 5, 6];
      for (const r of defaultRows) {
        for (const c of defaultCols) {
          const key = `${r}${c}`;
          if (idx < res.students.length) {
            initialMap[key] = res.students[idx].id;
            idx++;
          }
        }
      }
      setSeatMap(initialMap);
      setRowCount(5);
      setColCount(6);
    } else {
      setSeatMap({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClassChange = (newClassId: string) => {
    setSelectedClassId(newClassId);
    loadData(newClassId);
  };

  const handleSaveLayout = async () => {
    if (!selectedClassId) return;
    setSavingLayout(true);
    const jsonStr = JSON.stringify({ rows: rowCount, cols: colCount, seats: seatMap });
    const res = await saveCinemaSeatingLayout(selectedClassId, jsonStr);
    setSavingLayout(false);

    if (res.success) {
      showToast("Đã lưu sơ đồ chỗ ngồi thành công!", "success");
    } else {
      showToast(res.error || "Không thể lưu sơ đồ", "error");
    }
  };

  const getStudentBySeat = (seatKey: string) => {
    const studentId = seatMap[seatKey];
    if (!studentId) return null;
    return students.find((s) => s.id === studentId) || null;
  };

  const unseatedStudents = students.filter(
    (s) => !Object.values(seatMap).includes(s.id)
  );

  const occupiedCount = Object.keys(seatMap).filter((k) => seatMap[k]).length;

  const handleAutoArrange = (type: "NAME" | "MONITOR" | "RANDOM") => {
    let sortedList = [...students];
    if (type === "NAME") {
      sortedList.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else if (type === "MONITOR") {
      sortedList.sort((a, b) => (b.isClassMonitor ? 1 : 0) - (a.isClassMonitor ? 1 : 0));
    } else if (type === "RANDOM") {
      sortedList.sort(() => Math.random() - 0.5);
    }

    const newMap: SeatMapping = {};
    let idx = 0;
    for (const r of rows) {
      for (const c of cols) {
        if (idx < sortedList.length) {
          newMap[`${r}${c}`] = sortedList[idx].id;
          idx++;
        }
      }
    }
    setSeatMap(newMap);
    showToast("Đã sắp xếp chỗ ngồi thành công!", "success");
  };

  const handleClearAllSeats = () => {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả vị trí chỗ ngồi hiện tại không?")) {
      setSeatMap({});
      showToast("Đã xóa vị trí chỗ ngồi", "info");
    }
  };

  const handleSeatClick = (seatKey: string) => {
    const student = getStudentBySeat(seatKey);

    if (!student) {
      setTargetSeatKey(seatKey);
      setAssignStudentId("");
      setAssignModalOpen(true);
      return;
    }

    setSelectedSeatKey(seatKey);
    setSelectedStudentForEval(student);
    setSelectedCriteria(PRESET_CRITERIA[0]);
    setCustomNote("");
    setEvalModalOpen(true);
  };

  const handleAssignSeat = () => {
    if (!targetSeatKey) return;
    setSeatMap((prev) => {
      const updated = { ...prev };
      if (!assignStudentId) {
        delete updated[targetSeatKey];
      } else {
        Object.keys(updated).forEach((k) => {
          if (updated[k] === assignStudentId) delete updated[k];
        });
        updated[targetSeatKey] = assignStudentId;
      }
      return updated;
    });
    setAssignModalOpen(false);
    showToast(`Đã cập nhật vị trí ghế ${targetSeatKey}`, "success");
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedStudentForEval || !selectedClassId) return;

    setEvaluating(true);
    const res = await evaluateStudentSeatPoint({
      studentId: selectedStudentForEval.id,
      classId: selectedClassId,
      points: selectedCriteria.points,
      category: selectedCriteria.category,
      badgeTitle: selectedCriteria.badgeTitle,
      description: customNote.trim() || selectedCriteria.label,
      seatLabel: `Hàng ${selectedSeatKey[0]} - Ghế ${selectedSeatKey.slice(1)}`,
    });
    setEvaluating(false);

    if (res.success) {
      showToast(
        `Đã ghi nhận đánh giá cho học sinh ${selectedStudentForEval.name}!`,
        "success"
      );
      setEvalModalOpen(false);
      loadData(selectedClassId);
    } else {
      showToast(res.error || "Đánh giá thất bại", "error");
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {ToastComponent}

      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs font-semibold text-indigo-300">
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sơ Đồ Chỗ Ngồi Trực Quan & Đánh Giá Tích Cực</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Sơ Đồ Không Gian Lớp Học & Rèn Luyện
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              Quản lý vị trí chỗ ngồi học sinh trực quan, ghi nhận đánh giá nếp sống và thi đua lớp học theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Switcher */}
            {classes.length > 0 && (
              <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-400 ml-2" />
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-hidden cursor-pointer pr-2"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 font-bold">
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleSaveLayout}
              disabled={savingLayout}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingLayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Sơ Đồ Chỗ Ngồi</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Sĩ số học sinh</span>
            <span className="text-xl md:text-2xl font-black mt-0.5 block">{students.length} HS</span>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Số ghế đã xếp</span>
            <span className="text-xl md:text-2xl font-black mt-0.5 block text-emerald-400">
              {occupiedCount} / {rows.length * cols.length}
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Chưa xếp chỗ</span>
            <span className="text-xl md:text-2xl font-black mt-0.5 block text-amber-400">
              {unseatedStudents.length} HS
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block">Lượt đánh giá</span>
            <span className="text-xl md:text-2xl font-black mt-0.5 block text-indigo-400">{logs.length} lượt</span>
          </div>
        </div>
      </div>

      {/* ===== CONTROLS & TOOLBAR ===== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900">
            <Zap className="w-3.5 h-3.5 text-indigo-600" /> Sơ đồ quản lý & Đánh giá trực quan
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" /> Cấu Hình Kích Thước ({rowCount}x{colCount})
          </button>

          <div className="relative group">
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" /> Tự Động Xếp Chỗ <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-30 hidden group-hover:block animate-fade-in">
              <button
                onClick={() => handleAutoArrange("NAME")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Theo tên A - Z
              </button>
              <button
                onClick={() => handleAutoArrange("MONITOR")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Ban cán sự ngồi trước
              </button>
              <button
                onClick={() => handleAutoArrange("RANDOM")}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Xếp chỗ ngẫu nhiên
              </button>
            </div>
          </div>

          <button
            onClick={handleClearAllSeats}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa Tất Cả Ghế
          </button>
        </div>
      </div>

      {/* ===== UNSEATED STUDENTS DRAWER/BAR ===== */}
      {unseatedStudents.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-4 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-600" /> Học Sinh Chưa Được Xếp Chỗ ({unseatedStudents.length} học sinh)
            </span>
            <span className="text-[11px] font-medium text-amber-900">Nhấp vào ô ghế trống trên sơ đồ để xếp chỗ cho học sinh</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {unseatedStudents.map((s) => (
              <div
                key={s.id}
                className="px-3.5 py-2 rounded-2xl bg-white border border-amber-200 text-slate-800 text-xs font-bold shadow-2xs flex items-center gap-2 shrink-0"
              >
                <span>{s.name}</span>
                {s.isClassMonitor && <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md border border-amber-200">LT</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SEATING GRID CONTAINER ===== */}
      <div className="bg-slate-50 p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
        {/* BLACKBOARD BAR */}
        <div className="text-center space-y-2 relative z-10">
          <div className="mx-auto max-w-xl h-10 rounded-2xl bg-slate-800 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center gap-2 text-slate-200 font-bold text-xs tracking-wider uppercase border border-slate-700">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>BẢNG ĐEN / MÀN HÌNH GIẢNG DẠY</span>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-600">
            Nhấp vào vị trí học sinh để thực hiện đánh giá tích cực hoặc xếp chỗ ngồi
          </p>
        </div>

        {/* SEATING GRID */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Đang tải sơ đồ chỗ ngồi...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-6xl mx-auto relative z-10 overflow-x-auto pb-4 custom-scrollbar">
            {rows.map((row) => (
              <div key={row} className="flex items-center justify-center gap-3 sm:gap-4 min-w-[720px]">
                {/* Row Header Badge */}
                <div className="w-9 h-11 rounded-2xl bg-white border border-slate-200 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {row}
                </div>

                {/* Seat Cards Row */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-center">
                  {cols.map((col) => {
                    const seatKey = `${row}${col}`;
                    const student = getStudentBySeat(seatKey);
                    const isMiddleAisle = col === Math.ceil(cols.length / 2);

                    return (
                      <div key={seatKey} className={`flex items-center ${isMiddleAisle ? "mr-6 sm:mr-8" : ""}`}>
                        <div
                          onClick={() => handleSeatClick(seatKey)}
                          className={`w-28 sm:w-34 h-22 sm:h-24 rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 text-left relative group cursor-pointer border ${
                            student
                              ? "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 shadow-2xs"
                              : "bg-slate-100/80 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                          }`}
                        >
                          {/* Seat Label */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
                              {seatKey}
                            </span>
                            {student ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Trophy className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                <span>{student.bonusPoints || 0}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">Trống</span>
                            )}
                          </div>

                          {/* Student Info */}
                          {student ? (
                            <div className="min-w-0 my-0.5">
                              <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {student.name}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate mt-0.5">
                                <span>{student.studentCode || "HS"}</span>
                                {student.isClassMonitor && (
                                  <span className="bg-amber-100 text-amber-900 border border-amber-200 px-1 rounded-sm text-[9px] font-bold">
                                    LT
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-[10px] font-semibold text-slate-400 block group-hover:text-indigo-600 transition-colors">
                                + Xếp chỗ
                              </span>
                            </div>
                          )}

                          {/* Hint */}
                          <div className="text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {student ? "Đánh giá" : "+ Xếp chỗ"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="w-9 h-11 rounded-2xl bg-white border border-slate-200 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  {row}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== RECENT EVALUATION HISTORY FEED ===== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Lịch Sử Đánh Giá Gần Đây</span>
          </h3>
          <span className="text-xs font-medium text-slate-500">{logs.length} bản ghi</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Chưa có đánh giá nào được ghi nhận.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {logs.map((log) => {
              const isCommendation = log.type === "COMMENDATION";
              const logDate = new Date(log.date);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isCommendation ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isCommendation ? <Award className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{log.studentName}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isCommendation ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isCommendation ? "Tuyên dương tích cực" : "Nhắc nhở nếp sống"}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {logDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      {logDate.toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== GRID CONFIG MODAL ===== */}
      <Modal isOpen={configModalOpen} onClose={() => setConfigModalOpen(false)} title="Cấu Hình Kích Thước Sơ Đồ">
        <div className="space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Thay đổi số hàng và số cột để tạo sơ đồ chỗ ngồi phù hợp với quy mô phòng học.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số Hàng Ghế (A, B, C...)</label>
              <select
                value={rowCount}
                onChange={(e) => setRowCount(Number(e.target.value))}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-hidden"
              >
                {[3, 4, 5, 6, 7, 8].map((r) => (
                  <option key={r} value={r}>
                    {r} hàng (A - {ALL_ROWS[r - 1]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số Cột Ghế Mỗi Hàng</label>
              <select
                value={colCount}
                onChange={(e) => setColCount(Number(e.target.value))}
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-hidden"
              >
                {[4, 5, 6, 7, 8, 9, 10].map((c) => (
                  <option key={c} value={c}>
                    {c} ghế / hàng
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 text-xs font-bold flex items-center justify-between">
            <span>Tổng số ghế sơ đồ:</span>
            <span className="text-sm font-black text-indigo-600">{rowCount * colCount} ghế</span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setConfigModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                setConfigModalOpen(false);
                showToast("Đã cập nhật kích thước sơ đồ lớp học!", "success");
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Xác Nhận Áp Dụng
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== QUICK EVALUATION MODAL ===== */}
      <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Đánh Giá Chỗ Ngồi">
        {selectedStudentForEval && (
          <div className="space-y-5">
            {/* Student Info Card */}
            <div className="bg-slate-900 p-4 rounded-2xl text-white flex items-center justify-between border border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Vị trí: Ghế {selectedSeatKey}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedStudentForEval.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mã: {selectedStudentForEval.studentCode || "Chưa cấp"} • Điểm tích lũy: {selectedStudentForEval.bonusPoints || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center border border-slate-700">
                {selectedSeatKey}
              </div>
            </div>

            {/* Criteria Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tiêu Chí Đánh Giá *</label>
              <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
                {PRESET_CRITERIA.map((crit) => {
                  const isSelected = selectedCriteria.id === crit.id;
                  const CriterionIcon = ICON_MAP[crit.icon] || Sparkles;

                  return (
                    <button
                      key={crit.id}
                      type="button"
                      onClick={() => setSelectedCriteria(crit)}
                      className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CriterionIcon className={`w-4 h-4 ${crit.points >= 0 ? "text-indigo-600" : "text-rose-600"}`} />
                        <span>{crit.label}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          crit.points >= 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {crit.points >= 0 ? `+${crit.points}` : crit.points} điểm
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Chi Tiết (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Nhập chi tiết nhận xét..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvalModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                disabled={evaluating}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {evaluating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Ghi Nhận Đánh Giá</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== ASSIGN SEAT MODAL ===== */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Xếp Chỗ Ngồi Ghế ${targetSeatKey}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Chọn học sinh để xếp ngồi vào <strong className="text-slate-900 font-bold">Ghế {targetSeatKey}</strong>:
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Học Sinh</label>
            <select
              value={assignStudentId}
              onChange={(e) => setAssignStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50 focus:bg-white transition-all"
            >
              <option value="">-- Để trống ghế này --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentCode || "Chưa có mã"}) {s.isClassMonitor ? "• Lớp Trưởng" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleAssignSeat}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Xác Nhận Xếp Chỗ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
