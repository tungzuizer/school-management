"use client";

import { useState } from "react";
import {
  Sparkles,
  FileText,
  Building2,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  Download,
  Share2,
  MapPin,
  Sun,
  Clock,
  Moon,
  ChevronRight,
} from "lucide-react";

export default function DailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeCyclePhase, setActiveCyclePhase] = useState<
    "MORNING" | "MIDDAY" | "EVENING"
  >("EVENING");
  const [isGenerating, setIsGenerating] = useState(false);

  const [summaryData, setSummaryData] = useState({
    date: "10/08/2026",
    totalStudents: 1450,
    totalAbsent: 18,
    absentWithReason: 15,
    absentNoReason: 3,
    teacherAbsences: 3,
    substituteFulfilled: "3/3 (100%)",
    schoolPoints: [
      {
        name: "Điểm trường Trung Tâm",
        distanceKm: 0.0,
        manager: "Cô Trần Thị Mai",
        studentsCount: 850,
        presentRate: "99.2%",
        incidents: 1,
        weatherStatus: "Nắng nhẹ, giao thông bình thường",
        substituteNote: "Cô Bích dạy thay Tiết 2 môn Toán 10A1",
        note: "Kỷ luật ổn định, 100% các lớp hoàn thành điểm danh tự động.",
      },
      {
        name: "Điểm Bản Mó",
        distanceKm: 5.2,
        manager: "Thầy Lê Văn Tùng",
        studentsCount: 320,
        presentRate: "98.1%",
        incidents: 0,
        weatherStatus: "Sương mù sương sớm, đường khô ráo",
        substituteNote: "Thầy Minh di chuyển 5.2km dạy tiếp Tiết 4 Vật lý",
        note: "Tiến độ bài học ghi nhận đầy đủ.",
      },
      {
        name: "Điểm Bản Pún",
        distanceKm: 8.5,
        manager: "Cô Đỗ Thị Hà",
        studentsCount: 180,
        presentRate: "95.5%",
        incidents: 1,
        weatherStatus: "Mưa suối dâng, đường trơn trượt",
        substituteNote: "Cô Mai dạy ghép Tiết 3 Ngữ văn 8B1",
        note: "14 học sinh chòm bản cao chưa qua được suối (đã hướng dẫn tự học).",
      },
      {
        name: "Điểm Phia Xam",
        distanceKm: 14.2,
        manager: "Thầy Nguyễn Văn Nam",
        studentsCount: 100,
        presentRate: "93.0%",
        incidents: 1,
        weatherStatus: "Sương mù mỏng, sóng di động chập chờn",
        substituteNote: "GV điều chuyển luân phiên từ Bản Mó",
        note: "1 học sinh vắng 5 ngày liên tiếp (đã báo Rada Cảnh Báo Sớm).",
      },
    ],
    morningBriefing: `[PHA 1 - ĐẦU CA SÁNG 07:30]: 
- Điểm danh toàn hệ thống 4 điểm trường: 1.432/1.450 học sinh có mặt (98.76%).
- Phát hiện 03 GV vắng mặt đột xuất. Rada AI đã phát lệnh điều chuyển dạy thay cho 3 tiết học tại Điểm Trung Tâm, Bản Mó và Bản Pún.
- Tình hình di chuyển: Đường lên Điểm Phia Xam (14.2km) sương mù nhẹ; suối Bản Pún nước dâng nhẹ.`,
    middayBriefing: `[PHA 2 - GIỮA NGÀY 11:30]:
- 100% các lớp tại 4 điểm trường hoàn thành ghi sổ đầu bài điện tử.
- Điểm Bản Mó chậm 3 tiết môn Toán khối 9 (đã duyệt phương án dạy bù tuần sau).
- 14 học sinh tại chòm bản cao Bản Pún được xác nhận an toàn tại nhà.`,
    eveningBriefing: `BÁO CẢO ĐIỀU HÀNH TỔNG HỢP CUỐI NGÀY 10/08/2026 - BAN GIÁM HIỆU

1. TỔNG QUAN 4 ĐIỂM TRƯỜNG PHÂN TÁN:
- Tổng số học sinh toàn trường: 1.450 học sinh. Tỷ lệ hiện diện chung đạt 98.2%.
- Điểm Phia Xam (14.2km) và Bản Pún (8.5km) chịu ảnh hưởng thời tiết vùng cao, tỷ lệ chuyên cần giảm nhẹ (93.0% và 95.5%).
- Đã xử lý 100% các tiết trống bằng cơ chế phân công AI theo khoảng cách địa lý.

2. AN NINH, AN TOÀN & RỦI RO CẢNH BÁO SỚM:
- Cảnh báo đỏ: 01 học sinh nguy cơ bỏ học tại Phia Xam (Em Nguyễn Văn Hùng - Lớp 9C1). Đã chỉ đạo Trưởng điểm trường phối hợp Trưởng bản đến nhà xác minh.
- An toàn thiên tai: Suối Bản Pún dâng cao, đã chỉ đạo thông báo phụ huynh không cho con tự vượt suối.

3. NHIỆM VỤ TRỌNG TÂM NGÀY MAI:
- Báo cáo PGD&ĐT về kế hoạch luân chuyển giáo viên Tiếng Anh lên Phia Xam.
- Đội ngũ Y tế tiến hành phun khử khuẩn tại Điểm Trung Tâm phòng ngừa cảm cúm mùa.`,
  });

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSummaryData((prev) => ({
        ...prev,
        eveningBriefing: `${prev.eveningBriefing}\n\n[CẬP NHẬT REALTIME LÚC ${new Date().toLocaleTimeString()}]: AI đã đối chiếu tự động dữ liệu từ 4 Trưởng điểm trường và 45 GVCN. Không phát sinh điểm nóng ngoài dự báo.`,
      }));
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Multi-Point 3-Phase Daily AI Summary</span>
            </div>
            <h1 className="text-2xl font-bold">Báo Cáo Điều Hành Chu Kỳ 3 Pha AI Hiệu Trưởng</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Tổng hợp tự động thông tin vận hành 3 thời điểm trong ngày (Đầu ca Sáng ➔ Giữa ngày ➔ Cuối ngày) từ 4 điểm trường phân tán.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition shadow flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-900 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "AI đang gom dữ liệu 4 điểm trường..." : "Tổng hợp báo cáo ngay"}
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker & 3-Phase Navigation Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-700">Ngày báo cáo:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 3-Phase Selector */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveCyclePhase("MORNING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "MORNING"
                ? "bg-amber-500 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Pha 1: Sáng (Điểm danh & Dạy thay)
          </button>
          <button
            onClick={() => setActiveCyclePhase("MIDDAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "MIDDAY"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pha 2: Trưa (Tiến độ & Sổ đầu bài)
          </button>
          <button
            onClick={() => setActiveCyclePhase("EVENING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "EVENING"
                ? "bg-emerald-700 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Pha 3: Tóm tắt Cuối ngày BGH
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            <Download className="w-4 h-4" />
            Xuất PDF
          </button>
          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            <Share2 className="w-4 h-4" />
            Gửi BGH & PGD
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Tổng học sinh (4 điểm trường)</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summaryData.totalStudents}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">98.2% Hiện diện toàn hệ thống</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Học sinh vắng mặt</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summaryData.totalAbsent}</p>
          <p className="text-xs text-gray-500 mt-1">
            {summaryData.absentWithReason} có phép / {summaryData.absentNoReason} chưa phép
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">GV vắng & Lệnh dạy thay</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{summaryData.teacherAbsences}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Điều chuyển AI: {summaryData.substituteFulfilled}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Điểm trường đồng bộ</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">4/4 điểm trường</p>
          <p className="text-xs text-gray-500 mt-1">Hoàn tất chu kỳ 3 pha</p>
        </div>
      </div>

      {/* Satellite School Points Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.schoolPoints.map((pt, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">{pt.name}</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 shrink-0">
                {pt.presentRate}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1.5">
              <p>Khoảng cách: <strong>{pt.distanceKm === 0 ? "Trung Tâm (0km)" : `${pt.distanceKm} km`}</strong></p>
              <p>Quản lý: <strong>{pt.manager}</strong></p>
              <p>Sĩ số: <strong>{pt.studentsCount} học sinh</strong></p>
              <p className="text-amber-700 font-medium">Thời tiết/Địa hình: <em>{pt.weatherStatus}</em></p>
              <p className="text-blue-700 font-medium">Dạy thay AI: <em>{pt.substituteNote}</em></p>
              <p className="text-gray-500 pt-1.5 border-t border-gray-100">{pt.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Executive Briefing Section depending on selected cycle phase */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-base">
              Bản Tóm Tắt AI Executive Briefing -{" "}
              {activeCyclePhase === "MORNING"
                ? "Pha 1: Sáng (Chuyên Cần & Dạy Thay)"
                : activeCyclePhase === "MIDDAY"
                ? "Pha 2: Giữa Ngày (Tiến Độ Bài Học)"
                : "Pha 3: Báo Cáo Điều Hành Cuối Ngày"}
            </h2>
          </div>
          <span className="text-xs text-slate-300">Tổng hợp tự động 4 điểm trường</span>
        </div>

        <div className="p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200/80">
            {activeCyclePhase === "MORNING"
              ? summaryData.morningBriefing
              : activeCyclePhase === "MIDDAY"
              ? summaryData.middayBriefing
              : summaryData.eveningBriefing}
          </pre>
        </div>
      </div>
    </div>
  );
}
