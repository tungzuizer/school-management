"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Zap,
  Shield,
  Sparkles,
  Layers,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene3Timetable({ progress }: SceneProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(15);

  useEffect(() => {
    if (progress < 0.1) {
      setSecondsRemaining(15);
    } else if (progress < 0.6) {
      const countdown = Math.max(0, Math.round(15 - ((progress - 0.1) / 0.5) * 15));
      setSecondsRemaining(countdown);
    } else {
      setSecondsRemaining(0);
    }
  }, [progress]);

  // Dynamic cursor trajectory
  let cursorX = 70;
  let cursorY = 25;
  let cursorLabel = "Kích Hoạt AI Solver Xếp TKB";
  let isClicking = false;

  if (progress < 0.25) {
    const t = progress / 0.25;
    cursorX = 70 - t * 45; // moves to ~25 (AI Solver action button)
    cursorY = 25 + t * 15; // moves to ~40
    cursorLabel = "Kích Hoạt AI Solver (Tự động 15s)";
    isClicking = progress > 0.16 && progress < 0.22;
  } else if (progress < 0.65) {
    const t = (progress - 0.25) / 0.4;
    cursorX = 25 + t * 45; // moves to ~70 (Grid & Teacher Constraints)
    cursorY = 40 + t * 20; // moves to ~60
    cursorLabel = "Kiểm Tra 100+ Ràng Buộc: 0% Trùng Lịch";
    isClicking = progress > 0.48 && progress < 0.54;
  } else {
    const t = (progress - 0.65) / 0.35;
    cursorX = 70 - t * 25; // moves to ~45 (Safety Algorithm)
    cursorY = 60 + t * 15; // moves to ~75
    cursorLabel = "Gom Lịch An Toàn: 1 Buổi = 1 Điểm Trường";
    isClicking = progress > 0.82 && progress < 0.88;
  }

  const annotations: SpotlightAnnotation[] = [
    {
      id: "ai-solver-action",
      x: 18,
      y: 18,
      width: 40,
      height: 25,
      title: "Thuật Toán AI Solver 15 Giây",
      badge: "NHANH HƠN 200 LẦN",
      description: "Xử lý hàng nghìn ràng buộc phức tạp trong nháy mắt, thay thế 3-5 ngày xếp tay",
      color: "emerald",
      visibleAfter: 0.12,
    },
    {
      id: "zero-conflict",
      x: 20,
      y: 48,
      width: 60,
      height: 40,
      title: "0% Xung Đột Lịch Dạy & Phòng Học",
      badge: "CHÍNH XÁC 100%",
      description: "Đảm bảo định mức tiết dạy, tránh trùng giờ, phân bổ đều các môn học",
      color: "sky",
      visibleAfter: 0.38,
    },
    {
      id: "safety-routing",
      x: 45,
      y: 70,
      title: "Gom Lịch An Toàn Mùa Mưa Lũ",
      badge: "BẢO VỆ THẦY CÔ",
      description: "Không phải chạy xe giữa các điểm trường trong cùng một buổi học",
      color: "amber",
      visibleAfter: 0.68,
    },
  ];

  return (
    <RealScreenViewer
      imageSrc="/screenshots/real_web/04_admin_schedule.png"
      urlPath="/admin/schedule"
      title="Xếp Thời Khóa Biểu Thông Minh & AI Solver"
      campusName="Trường TH Phố Lu • Bộ Xếp TKB Tự Động"
      progress={progress}
      initialScale={1.0}
      targetScale={1.14}
      initialPanX={0}
      targetPanX={-2}
      initialPanY={0}
      targetPanY={-6}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: Zap,
        label: "AI Solver: Xếp TKB Hoàn Tất Trong 15 Giây",
        value: secondsRemaining > 0 ? `Đang giải ràng buộc... ${secondsRemaining}s` : "0% Trùng Lịch • 100% Khả Thi",
        subtext: "Gom lịch an toàn 6 phân hiệu",
        badge: secondsRemaining === 0 ? "HOÀN TẤT" : "AI PROCESSING",
      }}
    />
  );
}
