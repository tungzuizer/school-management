"use client";

import React from "react";
import {
  Trophy,
  Activity,
  Radio,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  Target,
  Gauge,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene4TelemetryKpi({ progress }: SceneProps) {
  // Toggle between KPI Dashboard (first half) and Emulation Podium (second half)
  const isSecondPhase = progress > 0.5;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/05_admin_emulation.png"
    : "/screenshots/real_web/08_admin_kpi.png";
  const urlPath = isSecondPhase
    ? "/admin/emulation"
    : "/admin/kpi/principal-dashboard";

  // Dynamic cursor trajectory
  let cursorX = 75;
  let cursorY = 22;
  let cursorLabel = "Giám Sát KPI Mạng Lưới";
  let isClicking = false;

  if (progress < 0.25) {
    const t = progress / 0.25;
    cursorX = 75 - t * 45; // moves to ~30
    cursorY = 22 + t * 20; // moves to ~42
    cursorLabel = "8 Cảm Biến Telemetry Quét Sống 24/7";
    isClicking = progress > 0.16 && progress < 0.22;
  } else if (progress < 0.5) {
    const t = (progress - 0.25) / 0.25;
    cursorX = 30 + t * 40; // moves to ~70
    cursorY = 42 + t * 15; // moves to ~57
    cursorLabel = "Đối Soát Chỉ Số Vận Hành 6 Phân Hiệu";
    isClicking = progress > 0.38 && progress < 0.44;
  } else if (progress < 0.75) {
    const t = (progress - 0.5) / 0.25;
    cursorX = 70 - t * 40; // moves to ~30
    cursorY = 57 - t * 15; // moves to ~42
    cursorLabel = "Bảng Vàng Thi Đua & Nề Nếp Tức Thì";
    isClicking = progress > 0.62 && progress < 0.68;
  } else {
    const t = (progress - 0.75) / 0.25;
    cursorX = 30 + t * 35; // moves to ~65
    cursorY = 42 + t * 18; // moves to ~60
    cursorLabel = "Vinh Danh Podium Minh Bạch (Thang 0-105đ)";
    isClicking = progress > 0.86 && progress < 0.92;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "emulation-podium",
          x: 22,
          y: 20,
          width: 56,
          height: 48,
          title: "Điểm Mạnh #4: Động Cơ Thi Đua Thang 0-105đ",
          badge: "PODIUM TOP LỚP",
          description: "Tự động lượng hóa từ dữ liệu sổ đầu bài & chuyên cần thành thang điểm chuẩn hóa 0-105đ",
          color: "amber",
          visibleAfter: 0.54,
        },
        {
          id: "transparent-ranking",
          x: 35,
          y: 70,
          title: "Minh Bạch 360 Độ - Xóa Bỏ Cảm Tính",
          badge: "CÔNG BẰNG TUYỆT ĐỐI",
          description: "Triệt tiêu hoàn toàn tình trạng bình xét dồn cục cuối kỳ và tranh cãi thi đua",
          color: "emerald",
          visibleAfter: 0.72,
        },
      ]
    : [
        {
          id: "kpi-telemetry",
          x: 18,
          y: 18,
          width: 64,
          height: 35,
          title: "8 Cảm Biến Telemetry Quét Dữ Liệu Sống",
          badge: "GIÁM SÁT 24/7",
          description: "Chuyên cần 98.7%, nề nếp tiết học, tiến độ giảng dạy và cảnh báo rủi ro an toàn trường học",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "semantic-traffic-light",
          x: 52,
          y: 56,
          width: 42,
          height: 32,
          title: "Đèn Tín Hiệu Semantic Traffic Light",
          badge: "CẢNH BÁO RỦI RO",
          description: "Màu Xanh / Vàng / Đỏ báo hiệu tức thì lớp học sa sút để BGH chỉ đạo kịp thời",
          color: "emerald",
          visibleAfter: 0.32,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Trung Tâm Telemetry & Động Cơ Thi Đua"
      campusName="Trường TH Phố Lu • Telemetry & KPI"
      progress={progress}
      initialScale={1.0}
      targetScale={1.12}
      initialPanX={0}
      targetPanX={isSecondPhase ? -1 : -3}
      initialPanY={0}
      targetPanY={isSecondPhase ? -2 : -4}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: Gauge,
        label: "8 Cảm Biến Telemetry & Động Cơ Thi Đua 0-105đ",
        value: "Chuyên Cần 98.7% • Động Cơ Điểm 0-105đ • Vinh Danh Bục Vàng Hàng Tuần",
        subtext: "Xóa bỏ 100% đánh giá cảm tính",
        badge: "TELEMETRY 24/7",
      }}
    />
  );
}
