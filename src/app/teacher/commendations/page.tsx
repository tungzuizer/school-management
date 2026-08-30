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

const COMMENDATION_BADGES = [
  {
    category: "Học tập xuất sắc",
    badgeTitle: "Học Sinh Giỏi 💡",
    icon: Sparkles,
    color: "from-amber-500 to-yellow-500",
    bg: "bg-amber-50 border-amber-200 text-amber-900",
    desc: "Đạt thành tích cao trong học tập, kiểm tra hoặc phát biểu hay",
  },
  {
    category: "Văn nghệ & Phong trào",
    badgeTitle: "Nghệ Sĩ Nhí 🎤",
    icon: Trophy,
    color: "from-purple-500 to-pink-500",
    bg: "bg-purple-50 border-purple-200 text-purple-900",
    desc: "Tích cực tham gia các hoạt động văn nghệ, thể thao & phong trào",
  },
  {
    category: "Giúp đỡ bạn bè",
    badgeTitle: "Bạn Tốt 🤝",
    icon: Medal,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
    desc: "Hỗ trợ bạn cùng tiến, giúp đỡ mọi người xung quanh",
  },
  {
    category: "Chuyên cần & Kỷ luật",
    badgeTitle: "Gương Mẫu 🌟",
    icon: Star,
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50 border-blue-200 text-blue-900",
    desc: "Chấp hành tốt nội quy, đúng giờ & nếp sống văn minh",
  },
  {
    category: "Tiến bộ vượt bậc",
    badgeTitle: "Bứt Phá 🚀",
    icon: Zap,
    color: "from-rose-500 to-orange-500",
    bg: "bg-rose-50 border-rose-200 text-rose-900",
    desc: "Có sự nỗ lực vươn lên rõ rệt trong thời gian gần đây",
  },
];

export default function TeacherCommendationsPage() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedBadge, setSelectedBadge] = useState(COMMENDATION_BADGES[0]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setErrorMsg("Vui lòng chọn học sinh để tuyên dương.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Vui lòng nhập lý do / lời tuyên dương.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await createStudentCommendation({
      teacherUserId: session?.user?.id || "",
      studentId: selectedStudentId,
      category: selectedBadge.category,
      badgeTitle: selectedBadge.badgeTitle,
      description: description.trim(),
    });

    if (res.success) {
      setSuccessMsg("Tuyên dương thành công! Học sinh đã nhận được điểm thưởng +5.");
      setDescription("");
      const updatedLogs = await getRecentCommendations();
      setRecentLogs(updatedLogs);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || "Không thể gửi tuyên dương.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
        <p className="text-sm font-bold text-slate-600">Đang tải danh sách tuyên dương...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-rose-200 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-yellow-300" />
            Vinh Danh & Động Viên Học Sinh
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Tuyên Dương Khen Thưởng 🎉
          </h1>
          <p className="text-xs md:text-sm text-rose-100 max-w-2xl leading-relaxed">
            Gửi tặng các huy hiệu danh dự và điểm thưởng (+5 điểm) tới học sinh xuất sắc. Lời khen của Thầy Cô là động lực lớn nhất giúp học sinh phát triển toàn diện!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== FORM GỬI TUYÊN DƯƠNG ===== */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Tạo Tuyên Dương Mới</h2>
              <p className="text-xs text-slate-500 font-semibold">Chọn lớp, chọn học sinh và huy hiệu khen thưởng</p>
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
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all"
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
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all disabled:opacity-50"
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

            {/* Choose Badge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Chọn Huy Hiệu & Danh Mục Tuyên Dương
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMENDATION_BADGES.map((b) => {
                  const isSelected = selectedBadge.category === b.category;
                  const Icon = b.icon;
                  return (
                    <button
                      type="button"
                      key={b.category}
                      onClick={() => setSelectedBadge(b)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? `border-rose-500 shadow-md ${b.bg} ring-2 ring-rose-400/30`
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${b.color} text-white flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="text-xs font-black flex items-center gap-1">
                          {b.badgeTitle}
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 line-clamp-2">
                          {b.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nội dung Lời Tuyên Dương / Ghi Chú
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Em đã phát biểu rất xuất sắc bài tập Toán và nhiệt tình hỗ trợ các bạn trong giờ thảo luận nhóm..."
                className="w-full text-xs font-medium p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedStudentId}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs md:text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi tuyên dương...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Tuyên Dương & Tặng +5 Điểm Thưởng</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ===== BẢNG VÀNG TUYÊN DƯƠNG GẦN ĐÂY ===== */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Bảng Vàng Nhật Ký</h2>
              <p className="text-[11px] text-slate-500 font-semibold">Tuyên dương gần đây</p>
            </div>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">Chưa có lời tuyên dương nào gần đây</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100 hover:border-rose-200 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-600 fill-rose-600" />
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
