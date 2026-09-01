"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  Award,
  BookOpen,
  Target,
  Compass,
  CheckCircle2,
  Heart,
  ArrowRight,
  Flame,
  Star,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface StudentJourneyClientProps {
  initialData: {
    student: any;
    journeyResult: any;
    trendlinePoints: any[];
    interventions: any[];
    subjects: Array<{ id: string; name: string; code?: string }>;
  };
}

export default function StudentJourneyViewClient({
  initialData,
}: StudentJourneyClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const { student, journeyResult, trendlinePoints, interventions, subjects } = data;
  const regression = journeyResult.metrics;

  // Filtered trendline if subject is selected
  const filteredPoints = selectedSubjectId
    ? trendlinePoints.filter((p) => {
        const sub = subjects.find((s) => s.id === selectedSubjectId);
        return sub ? p.subjectName === sub.name : true;
      })
    : trendlinePoints;

  // Best score calculation
  const scores = journeyResult.dataPoints || [];
  const maxScore = scores.length > 0 ? Math.max(...scores.map((s: any) => s.score)) : 0;
  const baselineDelta = regression?.deltaFromBaseline || 0;

  const getEncouragement = (label: string) => {
    switch (label) {
      case "IMPROVING":
        return {
          title: "Bạn đang bứt phá vượt bậc! 🚀",
          desc: "Nỗ lực học tập của bạn đang mang lại những kết quả rất ấn tượng. Hãy tiếp tục phát huy tinh thần tuyệt vời này nhé!",
          badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          icon: <Flame className="w-5 h-5 text-emerald-400" />,
        };
      case "STABLE":
        return {
          title: "Phong độ học tập rất vững vàng! ✨",
          desc: "Bạn luôn duy trì được sự tập trung và kết quả ổn định qua từng kỳ thi. Một nền tảng rất đáng khen ngợi!",
          badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
          icon: <Award className="w-5 h-5 text-blue-400" />,
        };
      case "VOLATILE":
        return {
          title: "Cân bằng nhịp độ ôn tập 💡",
          desc: "Điểm số có đôi chút dao động giữa các kỳ thi. Hãy phân bổ thời gian học tập đều đặn mỗi tuần để kết quả ổn định hơn nhé.",
          badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          icon: <Zap className="w-5 h-5 text-amber-400" />,
        };
      case "DECLINING":
        return {
          title: "Đừng nản lòng, cùng nhau bứt phá! 💪",
          desc: "Mỗi thử thách là một cơ hội để tiến bộ. Thầy cô và nhà trường luôn sẵn sàng đồng hành cùng bạn trên từng trang sách.",
          badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
          icon: <Heart className="w-5 h-5 text-indigo-400" />,
        };
      default:
        return {
          title: "Khởi đầu hành trình học tập 🌱",
          desc: "Hệ thống đang tích lũy kết quả của các kỳ thi để vẽ nên biểu đồ hành trình của bạn. Chúc bạn luôn đạt kết quả tốt nhất!",
          badgeBg: "bg-slate-800 text-slate-400 border-slate-700",
          icon: <Compass className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  const encouragement = getEncouragement(regression?.trendLabel || "INSUFFICIENT_DATA");

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Hành Trình Học Tập Của Tôi
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Xin chào, {student.user.name}! 🌟
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-xl">
                Lớp {student.classRoom.name} • {student.classRoom.school.name}
              </p>
            </div>

            <div
              className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-lg ${encouragement.badgeBg}`}
            >
              {encouragement.icon}
              <div>
                <div className="text-sm font-bold">{encouragement.title}</div>
                <div className="text-xs opacity-90 max-w-xs">{encouragement.desc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Điểm số cao nhất</div>
            <div className="text-2xl font-black text-white font-mono">{maxScore > 0 ? maxScore.toFixed(1) : "—"}</div>
            <div className="text-[11px] text-amber-400/80">Kỷ lục bài thi</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Thay đổi so với kỳ đầu</div>
            <div
              className={`text-2xl font-black font-mono ${
                baselineDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {baselineDelta !== null ? `${baselineDelta > 0 ? "+" : ""}${baselineDelta.toFixed(2)} đ` : "—"}
            </div>
            <div className="text-[11px] text-slate-400">Tiến độ tích lũy</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Kỳ thi hoàn thành</div>
            <div className="text-2xl font-black text-white font-mono">{scores.length} kỳ</div>
            <div className="text-[11px] text-indigo-400">Các đợt đánh giá</div>
          </div>
        </div>
      </div>

      {/* Interactive Growth Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Biểu Đồ Tiến Trình Học Tập Của Bạn
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Đường màu tím thể hiện điểm số thực tế qua từng kỳ thi; đường nét đứt biểu thị xu hướng bứt phá.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lọc theo môn:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả các môn học</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {trendlinePoints.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPoints}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="periodName"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actualScore"
                  name="Điểm bài thi"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
                <Line
                  type="linear"
                  dataKey="predictedScore"
                  name="Đường định hướng tiến bộ"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            Chưa có đủ điểm số để hiển thị biểu đồ tiến trình.
          </div>
        )}
      </div>

      {/* Action Goals & Mentorship Support */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            Mục Tiêu & Kế Hoạch Đồng Hành Cùng Thầy Cô
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Các mục tiêu học tập và kế hoạch rèn luyện được thầy cô xây dựng riêng cho bạn.
          </p>
        </div>

        {interventions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800/90 p-5 rounded-2xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {item.interventionType}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {item.note || "Kế hoạch đồng hành cùng học sinh."}
                </p>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                  <span>Trạng thái: <strong className="text-white">{item.status}</strong></span>
                  {item.appliedByName && (
                    <span className="text-indigo-400 font-bold">Thực hiện: {item.appliedByName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/60 text-slate-400 text-sm">
            Hiện tại bạn đang học tập rất tốt và chưa cần áp dụng kế hoạch phụ đạo bổ trợ nào. Hãy tiếp tục duy trì nhé! 🌟
          </div>
        )}
      </div>
    </div>
  );
}
