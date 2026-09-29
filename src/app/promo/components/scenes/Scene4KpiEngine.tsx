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
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene4KpiEngine({ progress }: SceneProps) {
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
          title: "Bảng Vàng Thi Đua & Nề Nếp Realtime",
          badge: "PODIUM TOP LỚP",
          description: "Tự động lượng hóa từ sổ đầu bài & chuyên cần thành thang điểm 0-105đ",
          color: "amber",
          visibleAfter: 0.54,
        },
        {
          id: "transparent-ranking",
          x: 35,
          y: 70,
          title: "Minh Bạch 360 Độ",
          badge: "KHÔNG CẢM TÍNH",
          description: "Triệt tiêu hoàn toàn bình xét dồn cục cuối kỳ",
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
          title: "8 Cảm Biến Telemetry Real-Time",
          badge: "SỐNG 100%",
          description: "Chuyên cần 98.7%, nề nếp, tiến độ dạy, vi phạm, cảnh báo rủi ro tức thì",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "campus-kpi-matrix",
          x: 25,
          y: 55,
          width: 50,
          height: 35,
          title: "Ma Trận KPI Mạng Lưới 6 Phân Hiệu",
          badge: "SO SÁNH ĐỐI SOÁT",
          description: "Đo lường hiệu suất vận hành từng điểm trường theo thời gian thực",
          color: "indigo",
          visibleAfter: 0.3,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Trung Tâm Chỉ Huy & Động Cơ Thi Đua Số"
      campusName="Trường TH Phố Lu • Giám Sát Vận Hành"
      progress={isSecondPhase ? (progress - 0.5) * 2 : progress * 2}
      initialScale={1.0}
      targetScale={1.12}
      initialPanX={0}
      targetPanX={isSecondPhase ? -1 : -3}
      initialPanY={0}
      targetPanY={isSecondPhase ? -4 : -5}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: isSecondPhase ? Trophy : Activity,
        label: isSecondPhase
          ? "Động Cơ Thi Đua Tự Động Thang Điểm 0 - 105đ"
          : "8 Cảm Biến Telemetry & Cockpit Chỉ Huy Real-Time",
        value: isSecondPhase
          ? "Vinh Danh Hàng Tuần • Cập Nhật Từng Tiết Học"
          : "Quét Dữ Liệu 6 Phân Hiệu • 0 Độ Trễ",
        subtext: "Dữ liệu thực tế qlthvn.com",
        badge: isSecondPhase ? "PODIUM HONORS" : "8 SENSORS LIVE",
      }}
    />
  );
}
