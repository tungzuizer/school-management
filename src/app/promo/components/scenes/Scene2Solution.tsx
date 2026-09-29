"use client";

import React from "react";
import {
  Sparkles,
  LayoutDashboard,
  Building2,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene2Solution({ progress }: SceneProps) {
  // Toggle between Admin Dashboard and Multi-Campus Map/Grid
  const isSecondPhase = progress > 0.6;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/09_admin_campuses.png"
    : "/screenshots/real_web/03_admin_dashboard.png";
  const urlPath = isSecondPhase ? "/admin/campuses" : "/admin/dashboard";

  // Dynamic cursor trajectory
  let cursorX = 80;
  let cursorY = 22;
  let cursorLabel = "Trung Tâm Điều Hành Đa Phân Hiệu";
  let isClicking = false;

  if (progress < 0.3) {
    const t = progress / 0.3;
    cursorX = 80 - t * 50; // moves to ~30
    cursorY = 22 + t * 18; // moves to ~40
    cursorLabel = "Giám sát vận hành 6 phân hiệu & điểm trường";
    isClicking = progress > 0.18 && progress < 0.24;
  } else if (progress < 0.6) {
    const t = (progress - 0.3) / 0.3;
    cursorX = 30 + t * 40; // moves to ~70
    cursorY = 40 + t * 20; // moves to ~60
    cursorLabel = "An Toàn Học Đường & Rủi Ro Học Tập Realtime";
    isClicking = progress > 0.46 && progress < 0.52;
  } else {
    const t = (progress - 0.6) / 0.4;
    cursorX = 70 - t * 35; // moves to ~35
    cursorY = 60 - t * 25; // moves to ~35
    cursorLabel = "Mạng lưới cơ sở & điểm trường liên thông 100%";
    isClicking = progress > 0.82 && progress < 0.88;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "campuses-network",
          x: 22,
          y: 20,
          width: 58,
          height: 60,
          title: "Mạng Lưới Đa Phân Hiệu Liên Thông",
          badge: "REALTIME SYNC",
          description: "Quản lý tập trung: Trung tâm Phố Lu, An Tiến, Sơn Hải, Sơn Hà 1, Sơn Hà 2, Tân Thành",
          color: "sky",
          visibleAfter: 0.62,
        },
      ]
    : [
        {
          id: "dash-header",
          x: 20,
          y: 12,
          width: 60,
          height: 25,
          title: "Trung Tâm Điều Hành Đa Phân Hiệu",
          badge: "CHỈ HUY SỐ",
          description: "BGH theo dõi trực tiếp sĩ số, nề nếp, chuyên cần và điều hành tức thì",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "safety-monitor",
          x: 48,
          y: 42,
          width: 45,
          height: 35,
          title: "An Toàn Học Đường & Rủi Ro Học Tập",
          badge: "CẢNH BÁO SỚM",
          description: "Phát hiện ngay nguy cơ bỏ học, học sinh sa sút và vắng mặt bất thường",
          color: "emerald",
          visibleAfter: 0.32,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Trung Tâm Điều Hành Quản Trị Đa Phân Hiệu"
      campusName="Trường TH Phố Lu • Chỉ Huy Toàn Diện"
      progress={progress}
      initialScale={1.0}
      targetScale={1.12}
      initialPanX={0}
      targetPanX={isSecondPhase ? -1 : -3}
      initialPanY={0}
      targetPanY={isSecondPhase ? -3 : -4}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: LayoutDashboard,
        label: "Bảng Chỉ Huy Đa Phân Hiệu Trực Tuyến 24/7",
        value: "Liên Thông 6 Phân Hiệu • 1.700 Học Sinh • 126 Giáo Viên • 62 Lớp",
        subtext: "Dữ liệu cập nhật tức thì",
        badge: "CHUYỂN ĐỔI SỐ",
      }}
    />
  );
}
