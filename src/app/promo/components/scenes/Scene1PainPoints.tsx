"use client";

import React from "react";
import {
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  MapPin,
  TrendingDown,
  XCircle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene1PainPoints({ progress }: SceneProps) {
  // Toggle between Landing page (first half) and Login Portal (second half)
  const isSecondPhase = progress > 0.5;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/02_login_portal.png"
    : "/screenshots/real_web/01_landing_hero.png";
  const urlPath = isSecondPhase ? "/login" : "/";

  // Dynamic cursor trajectory
  let cursorX = 75;
  let cursorY = 25;
  let cursorLabel = "Khảo sát thực tiễn: 100+ trang sổ/GV";
  let isClicking = false;

  if (progress < 0.25) {
    const t = progress / 0.25;
    cursorX = 75 - t * 45; // moves to ~30
    cursorY = 25 + t * 20; // moves to ~45
    cursorLabel = "Thực trạng: Sổ sách thủ công 100+ trang";
    isClicking = progress > 0.15 && progress < 0.2;
  } else if (progress < 0.5) {
    const t = (progress - 0.25) / 0.25;
    cursorX = 30 + t * 40; // moves to ~70
    cursorY = 45 + t * 15; // moves to ~60
    cursorLabel = "Nút thắt: 3-5 ngày xếp TKB";
    isClicking = progress > 0.38 && progress < 0.44;
  } else if (progress < 0.75) {
    const t = (progress - 0.5) / 0.25;
    cursorX = 50 - t * 20; // moves to ~30
    cursorY = 35 + t * 25; // moves to ~60
    cursorLabel = "Cổng đăng nhập chuẩn hóa 16 vai trò";
    isClicking = progress > 0.62 && progress < 0.68;
  } else {
    const t = (progress - 0.75) / 0.25;
    cursorX = 30 + t * 30; // moves to ~60
    cursorY = 60 - t * 10; // moves to ~50
    cursorLabel = "Đăng nhập BGH & Đồng bộ 6 phân hiệu";
    isClicking = progress > 0.88 && progress < 0.94;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "login-auth",
          x: 28,
          y: 28,
          width: 44,
          height: 48,
          title: "Xác Thực Tập Trung 16 Vai Trò",
          badge: "BẢO MẬT",
          description: "Phân quyền chặt chẽ: Sở, Phòng, BGH, Tổ trưởng, GVCN, Phụ huynh",
          color: "indigo",
          visibleAfter: 0.52,
        },
        {
          id: "role-demo",
          x: 48,
          y: 65,
          title: "Tự Động Hóa Đăng Nhập",
          badge: "TIỆN ÍCH",
          description: "Truy cập tức thì qua 1 chạm danh mục tài khoản",
          color: "emerald",
          visibleAfter: 0.7,
        },
      ]
    : [
        {
          id: "landing-hero",
          x: 20,
          y: 22,
          width: 60,
          height: 38,
          title: "Nền Tảng Quản Lý Nhà Trường Đa Điểm Trường",
          badge: "QLTHVN",
          description: "Giải pháp chuyển đổi số toàn diện xóa nhòa rào cản địa lý",
          color: "sky",
          visibleAfter: 0.08,
        },
        {
          id: "pain-stat",
          x: 15,
          y: 62,
          width: 70,
          height: 25,
          title: "5 Nút Thắt Quản Trị Truyền Thống",
          badge: "THÁCH THỨC",
          description: "100+ trang sổ tay • Xếp TKB 3-5 ngày • Đứt gãy 6 điểm trường",
          color: "rose",
          visibleAfter: 0.24,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Khảo Sát Thực Tiễn & Nền Tảng qlthvn.com"
      campusName="Trường TH Phố Lu • Chuyển Đổi Số"
      progress={isSecondPhase ? (progress - 0.5) * 2 : progress * 2}
      initialScale={1.0}
      targetScale={1.08}
      initialPanX={0}
      targetPanX={isSecondPhase ? 0 : -2}
      initialPanY={0}
      targetPanY={isSecondPhase ? -3 : -4}
      cursorX={cursorX}
      cursorY={cursorY}
      cursorLabel={cursorLabel}
      isClicking={isClicking}
      annotations={annotations}
      bottomPill={{
        icon: AlertTriangle,
        label: isSecondPhase
          ? "Cổng Xác Thực Số Hóa Toàn Diện"
          : "Thực Trạng Quản Trị Truyền Thống Cần Đột Phá",
        value: isSecondPhase
          ? "16 Vai Trò • Phân Quyền Bảo Mật Tuyệt Đối"
          : "Mất >500 Giờ/Năm • Đứt Gãy Dữ Liệu 6 Phân Hiệu",
        subtext: "qlthvn.com",
        badge: isSecondPhase ? "AUTHENTICATED" : "5 NÚT THẮT",
      }}
    />
  );
}
