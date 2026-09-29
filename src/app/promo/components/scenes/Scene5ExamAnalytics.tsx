"use client";

import React from "react";
import {
  TrendingUp,
  AlertOctagon,
  LineChart,
  Award,
  HeartHandshake,
  CheckCircle2,
  BrainCircuit,
  BarChart2,
  Sparkles,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene5ExamAnalytics({ progress }: SceneProps) {
  // Toggle between Exam Analytics and Transcripts
  const isSecondPhase = progress > 0.55;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/11_admin_transcripts.png"
    : "/screenshots/real_web/06_admin_exam_analytics.png";
  const urlPath = isSecondPhase
    ? "/admin/transcripts"
    : "/admin/exam-analytics";

  // Dynamic cursor trajectory
  let cursorX = 75;
  let cursorY = 22;
  let cursorLabel = "Phổ Điểm Chuẩn Hóa Gauss & OLS";
  let isClicking = false;

  if (progress < 0.3) {
    const t = progress / 0.3;
    cursorX = 75 - t * 45; // moves to ~30 (Gauss curve center)
    cursorY = 22 + t * 22; // moves to ~44
    cursorLabel = "Phổ Điểm Gauss & Độ Lệch Chuẩn σ";
    isClicking = progress > 0.18 && progress < 0.24;
  } else if (progress < 0.55) {
    const t = (progress - 0.3) / 0.25;
    cursorX = 30 + t * 45; // moves to ~75 (Early Warning)
    cursorY = 44 - t * 2;  // ~42
    cursorLabel = "Phát Hiện Sớm Học Sinh Sa Sút Từ Kỳ 3";
    isClicking = progress > 0.44 && progress < 0.5;
  } else if (progress < 0.8) {
    const t = (progress - 0.55) / 0.25;
    cursorX = 75 - t * 40; // moves to ~35
    cursorY = 42 + t * 20; // moves to ~62
    cursorLabel = "Sổ Điểm Điện Tử & Bảng Điểm Tức Thì";
    isClicking = progress > 0.68 && progress < 0.74;
  } else {
    const t = (progress - 0.8) / 0.2;
    cursorX = 35 + t * 30; // moves to ~65
    cursorY = 62 + t * 10; // moves to ~72
    cursorLabel = "Kích Hoạt Hồ Sơ Can Thiệp Sư Phạm";
    isClicking = progress > 0.88 && progress < 0.94;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "transcripts-table",
          x: 20,
          y: 20,
          width: 60,
          height: 55,
          title: "Sổ Điểm Điện Tử Minh Bạch",
          badge: "REALTIME GRADES",
          description: "Nhập điểm linh hoạt, tự động tổng kết học lực & cảnh báo điểm liệt",
          color: "sky",
          visibleAfter: 0.58,
        },
      ]
    : [
        {
          id: "gauss-chart",
          x: 20,
          y: 22,
          width: 58,
          height: 38,
          title: "Phổ Điểm Chuẩn Hóa Gaussian Bell Curve",
          badge: "OLS REGRESSION",
          description: "Đo lường độ lệch chuẩn σ, phân hóa đề thi và chất lượng dạy thực chất",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "early-warning-alert",
          x: 48,
          y: 62,
          width: 44,
          height: 30,
          title: "Cảnh Báo Sớm Từ Kỳ 3 (Trước 3-6 Tháng)",
          badge: "CAN THIỆP SỚM",
          description: "Phát hiện học sinh tụt hậu ngay khi mới chớm, kịp thời phụ đạo 1-1",
          color: "rose",
          visibleAfter: 0.32,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Khoa Học Dữ Liệu Khảo Thí & Phổ Điểm Gauss"
      campusName="Trường TH Phố Lu • Phân Tích Thực Chứng"
      progress={isSecondPhase ? (progress - 0.55) * 2.2 : progress * 1.8}
      initialScale={1.0}
      targetScale={1.12}
      initialPanX={0}
      targetPanX={isSecondPhase ? -1 : -3}
      initialPanY={0}
      targetPanY={isSecondPhase ? -3 : -5}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: isSecondPhase ? BarChart2 : BrainCircuit,
        label: isSecondPhase
          ? "Sổ Điểm Điện Tử & Bảng Điểm Toàn Diện"
          : "Khoa Học Khảo Thí & Phổ Điểm Gauss (153.000 Bài Thi)",
        value: isSecondPhase
          ? "100% Học Sinh Có Hồ Sơ Theo Dõi • Cảnh Báo Sớm"
          : "Cảnh Báo Sa Sút Sớm Trước 3-6 Tháng • Phụ Đạo 1-1",
        subtext: "Dữ liệu thực tế qlthvn.com",
        badge: isSecondPhase ? "E-TRANSCRIPT" : "AI GAUSS OLS",
      }}
    />
  );
}
