"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Award,
  Sparkles,
  Trophy,
  Medal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  User,
  School,
  History,
  Star,
  Zap,
  MessageSquarePlus,
  ThumbsUp,
  PlusCircle,
} from "lucide-react";
import {
  getTeacherClassesAndStudents,
  createStudentCommendation,
  getRecentCommendations,
} from "./actions";

interface ClassOption {
  id: string;
  name: string;
  students: { id: string; name: string; studentCode: string | null }[];
}

interface CommendationItem {
  id: string;
  description: string;
  date: string;
  reportedBy: string;
  studentName: string;
  className: string;
}

const EVALUATION_REASONS = [
  {
    category: "Phát biểu ý kiến",
    badgeTitle: "Tích cực phát biểu 🙋♂️",
    points: 2,
    icon: MessageSquarePlus,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50 border-blue-200 text-blue-900",
    desc: "Hăng hái giơ tay phát biểu & trả lời câu hỏi trong giờ học",
  },
  {
    category: "Xây dựng bài học",
    badgeTitle: "Xây dựng bài xuất sắc 💡",
    points: 3,
    icon: Sparkles,
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50 border-amber-200 text-amber-900",
    desc: "Đóng góp ý tưởng hay, tìm ra phương pháp giải độc đáo",
  },
  {
    category: "Làm bài tập tốt",
    badgeTitle: "Bài tập chuẩn chỉnh 📝",
    points: 2,
    icon: ThumbsUp,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
    desc: "Hoàn thành bài tập đúng hạn, đạt điểm cao & trình bày đẹp",
  },
  {
    category: "Hỗ trợ bạn bè",
    badgeTitle: "Bạn học cùng tiến 🤝",
    points: 2,
    icon: Medal,
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50 border-purple-200 text-purple-900",
    desc: "Hướng dẫn bài cho bạn, hợp tác nhóm tích cực",
  },
  {
    category: "Phong trào lớp",
    badgeTitle: "Năng nổ phong trào 🎤",
    points: 3,
    icon: Trophy,
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 border-rose-200 text-rose-900",
    desc: "Tích cực tham gia hoạt động văn nghệ, thể thao & trực nhật",
  },
  {
    category: "Chuyên cần nếp sống",
    badgeTitle: "Gương mẫu kỷ luật 🌟",
    points: 1,
    icon: Star,
    color: "from-sky-500 to-blue-600",
    bg: "bg-sky-50 border-sky-200 text-sky-900",
    desc: "Đúng giờ, giữ vệ sinh chung, chấp hành tốt quy định lớp",
  },
];

export default function TeacherCommendationsPage() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedReason, setSelectedReason] = useState(EVALUATION_REASONS[0]);
  const [customPoints, setCustomPoints] = useState<number>(2);
  const [description, setDescription] = useState("");

  const [recentLogs, setRecentLogs] = useState<CommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [classRes, logRes] = await Promise.all([
        getTeacherClassesAndStudents(),
        getRecentCommendations(),
      ]);

      if (classRes.classes && classRes.classes.length > 0) {
        setClasses(classRes.classes);
        setSelectedClassId(classRes.classes[0].id);
        if (classRes.classes[0].students.length > 0) {
          setSelectedStudentId(classRes.classes[0].students[0].id);
        }
      }

      setRecentLogs(logRes);
      setLoading(false);
    }
    loadData();
  }, []);

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    if (cls && cls.students.length > 0) {
      setSelectedStudentId(cls.students[0].id);
    } else {
      setSelectedStudentId("");
    }
  };

  const handleReasonClick = (reason: (typeof EVALUATION_REASONS)[0]) => {
    setSelectedReason(reason);
    setCustomPoints(reason.points);
    if (!description || EVALUATION_REASONS.some((r) => r.desc === description)) {
      setDescription(reason.desc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg("Vui lòng chọn học sinh để cộng điểm.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createStudentCommendation({
      teacherUserId: session?.user?.id || "",
      studentId: selectedStudentId,
      category: selectedReason.category,
      badgeTitle: selectedReason.badgeTitle,
      description: description.trim() || selectedReason.desc,
      points: Number(customPoints) || 2,
    });

    if (res.success) {
      setSuccessMsg(`Cộng điểm thành công! Đã cộng +${res.addedPoints || customPoints} điểm cho học sinh.`);
      const updatedLogs = await getRecentCommendations();
      setRecentLogs(updatedLogs);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || "Không thể cộng điểm học sinh.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600">Đang tải danh sách học sinh...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            Đánh Giá & Tinh Thần Học Tập
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Cộng Điểm Tích Cực Cho Học Sinh ⭐
          </h1>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Đánh giá tinh thần tích cực phát biểu, đóng góp xây dựng bài học, làm bài tập xuất sắc & chuyên cần để cộng điểm rèn luyện trực tiếp cho học sinh.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== FORM CỘNG ĐIỂM ===== */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Đánh Giá & Cộng Điểm Nhanh</h2>
              <p className="text-xs text-slate-500 font-semibold">Chọn lớp học, học sinh và tiêu chí tích cực</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Choose Class & Student */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-500" /> Chọn Lớp Học
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                >
                  {classes.length === 0 ? (
                    <option value="">Chưa có lớp học nào</option>
                  ) : (
                    classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.students.length} học sinh)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Chọn Học Sinh
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={!currentClass || currentClass.students.length === 0}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all disabled:opacity-50"
                >
                  {!currentClass || currentClass.students.length === 0 ? (
                    <option value="">Không có học sinh trong lớp</option>
                  ) : (
                    currentClass.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.studentCode ? `(${s.studentCode})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Choose Evaluation Criteria */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Chọn Lý Do / Tiêu Chí Khen Thưởng Tích Cực
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EVALUATION_REASONS.map((r) => {
                  const isSelected = selectedReason.category === r.category;
                  const Icon = r.icon;
                  return (
                    <button
                      type="button"
                      key={r.category}
                      onClick={() => handleReasonClick(r)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? `border-indigo-500 shadow-md ${r.bg} ring-2 ring-indigo-400/30`
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">{r.badgeTitle}</span>
                          <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            +{r.points} lần
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1 line-clamp-2">
                          {r.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select/Modify Custom Points */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Số Lần Khen Thưởng / Tích Cực Cộng Thêm
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[1, 2, 3, 5, 10].map((pts) => (
                  <button
                    type="button"
                    key={pts}
                    onClick={() => setCustomPoints(pts)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      customPoints === pts
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    +{pts} lần
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-slate-500 font-bold">Hoặc tự nhập:</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-xs font-black px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-center text-indigo-700 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chi Tiết Lời Tuyên Dương / Nhận Xét (Không bắt buộc)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập chi tiết nhận xét (ví dụ: Em đã hăng hái giơ tay trả lời 3 câu hỏi khó trong giờ Toán và giải bài tập trên bảng chính xác)..."
                className="w-full text-xs font-medium p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedStudentId}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs md:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ghi Nhận +{customPoints} Lần Khen Thưởng Cho Học Sinh</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ===== BẢNG VÀNG CỘNG ĐIỂM GẦN ĐÂY ===== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Lịch Sử Cộng Điểm</h2>
              <p className="text-[11px] text-slate-500 font-semibold">Đánh giá gần đây</p>
            </div>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Chưa có lượt cộng điểm nào gần đây</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100 hover:border-indigo-200 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                      {log.studentName} ({log.className})
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(log.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    {log.description}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    — Thầy/Cô: {log.reportedBy}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
