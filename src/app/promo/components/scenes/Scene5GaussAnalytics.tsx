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

export default function Scene5GaussAnalytics({ progress }: SceneProps) {
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
    cursorLabel = "Phổ Điểm Gauss 153.000 Bài Thi & Độ Lệch σ";
    isClicking = progress > 0.18 && progress < 0.24;
  } else if (progress < 0.55) {
    const t = (progress - 0.3) / 0.25;
    cursorX = 30 + t * 45; // moves to ~75 (Early Warning)
    cursorY = 44 - t * 2;  // ~42
    cursorLabel = "Hồi Quy OLS: Phát Hiện Sa Sút Từ Kỳ 3";
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
    cursorLabel = "Kích Hoạt Hồ Sơ Can Thiệp Sư Phạm 1-1";
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
          title: "Sổ Điểm Điện Tử & Phân Tích Thực Chất",
          badge: "REALTIME GRADES",
          description: "Nhập điểm linh hoạt, tự động tính trung bình, phân loại học lực và cảnh báo học sinh điểm liệt",
          color: "sky",
          visibleAfter: 0.58,
        },
        {
          id: "pedagogical-intervention",
          x: 45,
          y: 74,
          title: "Hồ Sơ Can Thiệp Sư Phạm 1-1",
          badge: "HỖ TRỢ KỊP THỜI",
          description: "Kết nối giáo viên chủ nhiệm & phụ huynh để kèm cặp học sinh trước khi quá muộn",
          color: "emerald",
          visibleAfter: 0.78,
        },
      ]
    : [
        {
          id: "gauss-chart",
          x: 20,
          y: 22,
          width: 58,
          height: 38,
          title: "Điểm Mạnh #5: Phổ Gauss Trên 153.000 Bài Thi",
          badge: "KHOA HỌC THỰC CHỨNG",
          description: "Đo lường độ lệch chuẩn σ, phân hóa đề thi và đánh giá chất lượng dạy học thực chất không ảo",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "early-warning-alert",
          x: 48,
          y: 62,
          width: 44,
          height: 30,
          title: "Cảnh Báo Sớm Từ Kỳ 3 (Sớm 3-6 Tháng)",
          badge: "MÔ HÌNH OLS",
          description: "Phát hiện học sinh tụt hậu ngay từ Kỳ 3 thay vì chờ đến cuối năm học mới xử lý",
          color: "rose",
          visibleAfter: 0.35,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Khoa Học Phổ Gauss & Cảnh Báo Sớm"
      campusName="Trường TH Phố Lu • Phân Tích Khảo Thí"
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
        icon: BrainCircuit,
        label: "Khoa Học Phổ Gauss & Cảnh Báo Sớm Từ Kỳ 3",
        value: "153.000 Bài Thi • Hồi Quy OLS • Cảnh Báo Sớm Trước 3-6 Tháng",
        subtext: "Lập hồ sơ can thiệp sư phạm 1-1",
        badge: "GAUSS & OLS",
      }}
    />
  );
}
