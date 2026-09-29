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
  Network,
  Radio,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene2MultiCampus({ progress }: SceneProps) {
  // Toggle between Admin Cockpit Dashboard and Multi-Campus Grid
  const isSecondPhase = progress > 0.5;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/09_admin_campuses.png"
    : "/screenshots/real_web/03_admin_dashboard.png";
  const urlPath = isSecondPhase ? "/admin/campuses" : "/admin/dashboard";

  // Dynamic cursor trajectory
  let cursorX = 80;
  let cursorY = 22;
  let cursorLabel = "Trung Tâm Điều Hành Đa Phân Hiệu";
  let isClicking = false;

  if (progress < 0.25) {
    const t = progress / 0.25;
    cursorX = 80 - t * 50; // moves to ~30
    cursorY = 22 + t * 18; // moves to ~40
    cursorLabel = "Bảng Chỉ Huy Cockpit Thời Gian Thực";
    isClicking = progress > 0.16 && progress < 0.22;
  } else if (progress < 0.5) {
    const t = (progress - 0.25) / 0.25;
    cursorX = 30 + t * 40; // moves to ~70
    cursorY = 40 + t * 15; // moves to ~55
    cursorLabel = "Giám Sát Toàn Bộ 6 Phân Hiệu Trực Tuyến";
    isClicking = progress > 0.38 && progress < 0.44;
  } else if (progress < 0.75) {
    const t = (progress - 0.5) / 0.25;
    cursorX = 70 - t * 40; // moves to ~30
    cursorY = 55 - t * 20; // moves to ~35
    cursorLabel = "Đồng Bộ Dữ Liệu 6 Phân Hiệu Không Độ Trễ";
    isClicking = progress > 0.62 && progress < 0.68;
  } else {
    const t = (progress - 0.75) / 0.25;
    cursorX = 30 + t * 35; // moves to ~65
    cursorY = 35 + t * 25; // moves to ~60
    cursorLabel = "Xóa Nhòa Khoảng Cách Địa Lý & Đèo Núi";
    isClicking = progress > 0.86 && progress < 0.92;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "campuses-network",
          x: 22,
          y: 20,
          width: 58,
          height: 60,
          title: "Điểm Mạnh #2: Mạng Lưới Đa Phân Hiệu Liên Thông",
          badge: "REALTIME SYNC 100%",
          description:
            "Quản lý tập trung không độ trễ: Trung tâm Phố Lu, An Tiến, Sơn Hải, Sơn Hà 1, Sơn Hà 2, Tân Thành",
          color: "sky",
          visibleAfter: 0.54,
        },
        {
          id: "no-distance-gap",
          x: 40,
          y: 72,
          title: "Xóa Nhòa Rào Cản Địa Lý",
          badge: "KHÔNG BÁO CÁO GIẤY",
          description: "Giáo viên và học sinh ở điểm trường xa nhất vẫn được thụ hưởng nền giáo dục số bình đẳng",
          color: "emerald",
          visibleAfter: 0.72,
        },
      ]
    : [
        {
          id: "dash-cockpit",
          x: 20,
          y: 12,
          width: 60,
          height: 25,
          title: "Bảng Chỉ Huy Cockpit Đa Phân Hiệu",
          badge: "CHỈ HUY SỐ",
          description:
            "Ban Giám Hiệu theo dõi trực tiếp sĩ số 1.700 học sinh, nề nếp 62 lớp và 126 giáo viên trên 1 màn hình duy nhất",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "realtime-kpi-sync",
          x: 48,
          y: 42,
          width: 45,
          height: 35,
          title: "Dữ Liệu Sống Thời Gian Thực",
          badge: "CẬP NHẬT TỨC THÌ",
          description: "Mọi thay đổi từ các điểm lẻ lập tức cập nhật về trung tâm, triệt tiêu chậm trễ báo cáo",
          color: "emerald",
          visibleAfter: 0.3,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Trung Tâm Điều Hành Quản Trị Đa Phân Hiệu"
      campusName="Trường TH Phố Lu • Mạng Lưới 6 Phân Hiệu"
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
        icon: Network,
        label: "Mạng Lưới Đa Phân Hiệu: Liên Thông Dữ Liệu 100%",
        value: "6 Phân Hiệu • 1.700 Học Sinh • 126 Giáo Viên • 62 Lớp Học",
        subtext: "Đồng bộ thời gian thực qua Cloud",
        badge: "LIÊN THÔNG 100%",
      }}
    />
  );
}
