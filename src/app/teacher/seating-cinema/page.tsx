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
  Film,
  Sparkles,
  Award,
  Trophy,
  Clock,
  UserCheck,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  School,
  Star,
  Zap,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";

interface SeatMapping {
  [seatKey: string]: string; // e.g. "A1": studentId
}

const ROWS = ["A", "B", "C", "D", "E"];
const COLS = [1, 2, 3, 4, 5, 6];

const PRESET_CRITERIA = [
  { label: "🎤 Hát hay / Đóng góp văn nghệ", points: 5, category: "Nghệ thuật", badgeTitle: "Sao Văn Nghệ" },
  { label: "💡 Phát biểu xây dựng bài xuất sắc", points: 3, category: "Học tập", badgeTitle: "Học Tập Xuất Sắc" },
  { label: "🤝 Tích cực giúp đỡ bạn học", points: 2, category: "Nếp sống", badgeTitle: "Bạn Tốt Đồng Hành" },
  { label: "📝 Làm bài tập xuất sắc", points: 2, category: "Học tập", badgeTitle: "Bài Tập Tốt" },
  { label: "⏰ Chuyên cần & Đúng giờ", points: 1, category: "Kỷ luật", badgeTitle: "Chuyên Cần Giờ Giấc" },
  { label: "⚠️ Nhắc nhở nếp sống / Mất trật tự", points: -1, category: "Vi phạm", badgeTitle: "Nhắc Nhở Nếp Sống" },
  { label: "🔴 Vi phạm nội quy lớp học", points: -2, category: "Vi phạm", badgeTitle: "Cảnh Báo Kỷ Luật" },
];

export default function CinemaSeatingPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; gradeLevel: number }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [students, setStudents] = useState<SeatStudent[]>([]);
  const [seatMap, setSeatMap] = useState<SeatMapping>({});
  const [logs, setLogs] = useState<EvaluationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLayout, setSavingLayout] = useState(false);

  // Quick Evaluation Modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedSeatKey, setSelectedSeatKey] = useState<string>("");
  const [selectedStudentForEval, setSelectedStudentForEval] = useState<SeatStudent | null>(null);
  const [selectedCriteria, setSelectedCriteria] = useState(PRESET_CRITERIA[1]);
  const [customNote, setCustomNote] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  // Seat Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetSeatKey, setTargetSeatKey] = useState<string>("");
  const [assignStudentId, setAssignStudentId] = useState<string>("");

  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async (classId?: string) => {
    setLoading(true);
    const res = await getCinemaClassAndStudents(classId);
    setClasses(res.classes);
    if (res.classRoom) {
      setSelectedClassId(res.classRoom.id);
      setClassName(res.classRoom.name);
    }
    setStudents(res.students);
    setLogs(res.logs);

    if (res.layoutJson) {
      try {
        const parsed = JSON.parse(res.layoutJson);
        if (parsed.seats) {
          setSeatMap(parsed.seats);
        }
      } catch {
        setSeatMap({});
      }
    } else {
      // Default auto-map first N students to seats
      const initialMap: SeatMapping = {};
      let idx = 0;
      for (const row of ROWS) {
        for (const col of COLS) {
          const key = `${row}${col}`;
          if (idx < res.students.length) {
            initialMap[key] = res.students[idx].id;
            idx++;
          }
        }
      }
      setSeatMap(initialMap);
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
    const jsonStr = JSON.stringify({ rows: ROWS.length, cols: COLS.length, seats: seatMap });
    const res = await saveCinemaSeatingLayout(selectedClassId, jsonStr);
    setSavingLayout(false);

    if (res.success) {
      showToast("Đã lưu sơ đồ chỗ ngồi Cinema thành công!", "success");
    } else {
      showToast(res.error || "Không thể lưu sơ đồ", "error");
    }
  };

  const handleOpenEvalModal = (seatKey: string) => {
    const studentId = seatMap[seatKey];
    if (!studentId) {
      // Seat is empty -> Open Assign Modal instead
      setTargetSeatKey(seatKey);
      setAssignStudentId("");
      setAssignModalOpen(true);
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setSelectedSeatKey(seatKey);
    setSelectedStudentForEval(student);
    setSelectedCriteria(PRESET_CRITERIA[1]);
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
        // Clear previous seat of this student if any
        Object.keys(updated).forEach((k) => {
          if (updated[k] === assignStudentId) delete updated[k];
        });
        updated[targetSeatKey] = assignStudentId;
      }
      return updated;
    });
    setAssignModalOpen(false);
    showToast(`Đã xếp học sinh vào ghế ${targetSeatKey}`, "success");
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
        `Đã cộng ${selectedCriteria.points > 0 ? "+" : ""}${selectedCriteria.points} điểm cho HS ${
          selectedStudentForEval.name
        }!`,
        "success"
      );
      setEvalModalOpen(false);
      loadData(selectedClassId);
    } else {
      showToast(res.error || "Đánh giá thất bại", "error");
    }
  };

  const getStudentBySeat = (seatKey: string) => {
    const studentId = seatMap[seatKey];
    if (!studentId) return null;
    return students.find((s) => s.id === studentId) || null;
  };

  const occupiedCount = Object.keys(seatMap).filter((k) => seatMap[k]).length;

  return (
    <div className="space-y-6 pb-16">
      {ToastComponent}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-700 via-purple-800 to-slate-900 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-200">
              <Film className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
              <span>Sơ đồ Chỗ ngồi Cinema & Đánh giá Nhanh</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Sơ Đồ Rạp Chiếu Phim Lớp Học</h1>
            <p className="text-sm text-rose-100/80 max-w-xl">
              Đánh giá nếp sống, tuyên dương điểm thưởng trực tiếp bằng cách bấm vào các thẻ ghế ngồi rạp phim.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Switcher */}
            {classes.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-2">
                <School className="w-4 h-4 text-rose-200 ml-2" />
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-2"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 font-semibold">
                      Lớp {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleSaveLayout}
              disabled={savingLayout}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingLayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Sơ Đồ Chỗ Ngồi</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-rose-200 block">Sĩ số lớp</span>
            <span className="text-2xl font-black mt-1 block">{students.length} HS</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-rose-200 block">Số ghế đã xếp</span>
            <span className="text-2xl font-black mt-1 block text-emerald-300">
              {occupiedCount} / {ROWS.length * COLS.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-rose-200 block">Ghế trống chưa xếp</span>
            <span className="text-2xl font-black mt-1 block text-amber-300">
              {ROWS.length * COLS.length - occupiedCount}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-rose-200 block">Đánh giá gần đây</span>
            <span className="text-2xl font-black mt-1 block text-purple-300">{logs.length} lượt</span>
          </div>
        </div>
      </div>

      {/* CINEMA HALL CONTAINER */}
      <div className="bg-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-10 relative overflow-hidden">
        {/* Cinema Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-rose-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* SCREEN / BLACKBOARD BAR */}
        <div className="text-center space-y-2 relative z-10">
          <div className="mx-auto max-w-2xl h-10 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 p-0.5 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center gap-3 text-white font-extrabold text-xs tracking-widest uppercase">
              <Film className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>🎥 MÀN HÌNH CHIẾU / BẢNG ĐEN LỚP HỌC 🎥</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">
            Bấm vào bất kỳ thẻ ghế để Đánh giá + Cộng điểm hoặc Xếp vị trí học sinh
          </p>
        </div>

        {/* CINEMA SEATING GRID */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400">Đang khởi tạo sơ đồ Rạp Chiếu Phim...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-5xl mx-auto relative z-10 overflow-x-auto pb-4 custom-scrollbar">
            {ROWS.map((row) => (
              <div key={row} className="flex items-center justify-center gap-3 sm:gap-4 min-w-[700px]">
                {/* Row Header Badge */}
                <div className="w-9 h-11 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                  {row}
                </div>

                {/* Seat Cards Row */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-center">
                  {COLS.map((col) => {
                    const seatKey = `${row}${col}`;
                    const student = getStudentBySeat(seatKey);
                    const isMiddleAisle = col === 3; // Gap after column 3

                    return (
                      <div key={seatKey} className={`flex items-center ${isMiddleAisle ? "mr-6 sm:mr-8" : ""}`}>
                        <button
                          onClick={() => handleOpenEvalModal(seatKey)}
                          className={`w-28 sm:w-32 h-20 sm:h-22 rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-200 text-left relative group cursor-pointer border ${
                            student
                              ? "bg-slate-900 border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-1"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
                          }`}
                        >
                          {/* Seat Label */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {seatKey}
                            </span>
                            {student ? (
                              <span className="text-[10px] font-black text-purple-300 bg-purple-950/80 border border-purple-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Trophy className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                <span>{student.bonusPoints || 0} lần</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-600">Trống</span>
                            )}
                          </div>

                          {/* Seat Main Body */}
                          {student ? (
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-white truncate group-hover:text-rose-300 transition-colors">
                                {student.name}
                              </h4>
                              <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                                {student.studentCode || "HS"} {student.isClassMonitor ? "• LT" : ""}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-[10px] font-bold text-slate-500 block group-hover:text-rose-400 transition-colors">
                                + Xếp chỗ
                              </span>
                            </div>
                          )}

                          {/* Quick Action Hint */}
                          <div className="text-[9px] font-bold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                            {student ? "Bấm để đánh giá ➔" : "Bấm xếp HS ➔"}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="w-9 h-11 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
                  {row}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT EVALUATION HISTORY FEED */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>Lịch Sử Đánh Giá & Tuyên Dương Nhanh</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">{logs.length} ghi nhận gần nhất</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Chưa có đánh giá nào được ghi nhận hôm nay.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {logs.map((log) => {
              const isCommendation = log.type === "COMMENDATION";
              const logDate = new Date(log.date);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-start justify-between gap-4"
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
                      <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{log.studentName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isCommendation ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                          }`}
                        >
                          {isCommendation ? "Tuyên dương" : "Nhắc nhở"}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{log.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {logDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                      {logDate.toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK EVALUATION MODAL */}
      <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Đánh Giá & Tuyên Dương Nhanh Chỗ Ngồi">
        {selectedStudentForEval && (
          <div className="space-y-5">
            {/* Student Info Card */}
            <div className="bg-gradient-to-r from-purple-900 to-slate-900 p-4 rounded-2xl text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block">
                  Vị trí: Ghế {selectedSeatKey}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">{selectedStudentForEval.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedStudentForEval.studentCode || "HS"} • Tích lũy: +{selectedStudentForEval.bonusPoints} điểm
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-200 font-black text-sm flex items-center justify-center border border-white/20">
                {selectedSeatKey}
              </div>
            </div>

            {/* Criteria Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700">Chọn Tiêu Chí Đánh Giá *</label>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {PRESET_CRITERIA.map((crit, idx) => {
                  const isSelected = selectedCriteria.label === crit.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCriteria(crit)}
                      className={`w-full p-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-50 border-purple-500 text-purple-900 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{crit.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black ${
                          crit.points >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
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
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Ghi Chú Chi Tiết (Tùy chọn)</label>
              <input
                type="text"
                placeholder="VD: Hát bài Tiếng Anh rất hay trong giờ sinh hoạt..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Timestamp Guarantee */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="w-3.5 h-3.5 text-purple-600" /> Tự động ghi thời gian thực:
              </span>
              <span className="font-mono font-bold text-slate-700">
                {new Date().toLocaleTimeString("vi-VN")} {new Date().toLocaleDateString("vi-VN")}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEvalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitEvaluation}
                disabled={evaluating}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {evaluating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Đánh Giá & Gửi Thông Báo</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ASSIGN SEAT MODAL */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Xếp Chỗ Ngồi Ghế ${targetSeatKey}`}>
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Chọn học sinh để xếp ngồi vào <strong className="text-slate-900">Ghế {targetSeatKey}</strong>:
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Học Sinh</label>
            <select
              value={assignStudentId}
              onChange={(e) => setAssignStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">-- Để trống ghế này --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentCode || "Chưa có mã"})
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Xác Nhận Xếp Chỗ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
