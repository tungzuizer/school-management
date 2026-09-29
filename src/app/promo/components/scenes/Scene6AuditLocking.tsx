"use client";

import React from "react";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  FileCheck2,
  KeyRound,
  FileText,
  Shield,
} from "lucide-react";
import RealScreenViewer, { SpotlightAnnotation } from "../RealScreenViewer";

interface SceneProps {
  progress: number;
}

export default function Scene6AuditLocking({ progress }: SceneProps) {
  // Toggle between Electronic Journals and Lesson Plans
  const isSecondPhase = progress > 0.55;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/10_admin_lesson_plans.png"
    : "/screenshots/real_web/07_admin_journals.png";
  const urlPath = isSecondPhase
    ? "/admin/lesson-plans"
    : "/admin/journals";

  // Dynamic cursor trajectory
  let cursorX = 75;
  let cursorY = 22;
  let cursorLabel = "Sổ Đầu Bài Điện Tử & Niêm Phong";
  let isClicking = false;

  if (progress < 0.3) {
    const t = progress / 0.3;
    cursorX = 75 - t * 45; // moves to ~30 (Sổ đầu bài tiết học)
    cursorY = 22 + t * 20; // moves to ~42
    cursorLabel = "Ghi Sổ Đầu Bài 1 Chạm Trên Di Động";
    isClicking = progress > 0.18 && progress < 0.24;
  } else if (progress < 0.55) {
    const t = (progress - 0.3) / 0.25;
    cursorX = 30 + t * 45; // moves to ~75 (Khóa niêm phong)
    cursorY = 42 + t * 5;  // ~47
    cursorLabel = "Thẩm Định 4 Cấp & Khóa Niêm Phong SHA-256";
    isClicking = progress > 0.44 && progress < 0.5;
  } else if (progress < 0.8) {
    const t = (progress - 0.55) / 0.25;
    cursorX = 75 - t * 40; // moves to ~35 (Kế hoạch bài dạy)
    cursorLabel = "Phê Duyệt Kế Hoạch Bài Dạy (Giáo Án)";
    cursorY = 47 - t * 15; // moves to ~32
    isClicking = progress > 0.68 && progress < 0.74;
  } else {
    const t = (progress - 0.8) / 0.2;
    cursorX = 35 + t * 30; // moves to ~65 (Audit log)
    cursorY = 32 + t * 35; // moves to ~67
    cursorLabel = "Kỷ Cương Số & Nhật Ký Kiểm Toán Bất Biến";
    isClicking = progress > 0.88 && progress < 0.94;
  }

  const annotations: SpotlightAnnotation[] = isSecondPhase
    ? [
        {
          id: "lesson-plans-approval",
          x: 22,
          y: 20,
          width: 58,
          height: 52,
          title: "Quản Lý Kế Hoạch Bài Dạy & Giáo Án",
          badge: "DUYỆT ĐIỆN TỬ",
          description: "Tổ trưởng & BGH duyệt giáo án trực tuyến, chấm dứt in ấn hàng trăm trang",
          color: "sky",
          visibleAfter: 0.58,
        },
      ]
    : [
        {
          id: "journal-table",
          x: 18,
          y: 20,
          width: 64,
          height: 40,
          title: "Sổ Đầu Bài Điện Tử & Điểm Danh 1 Chạm",
          badge: "CẮT GIẢM 90% GIẤY TỜ",
          description: "Giáo viên ghi chép nội dung bài học, nhận xét và xếp loại tiết học tức thì",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "four-level-lock",
          x: 45,
          y: 62,
          width: 48,
          height: 30,
          title: "Niêm Phong 4 Cấp & Khóa Kiểm Toán",
          badge: "BẢO MẬT TUYỆT ĐỐI",
          description: "Bản nháp ➔ Phân hiệu ➔ Hiệu phó ➔ Hiệu trưởng niêm phong chống sửa số liệu",
          color: "purple",
          visibleAfter: 0.32,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Sổ Đầu Bài Điện Tử & Kỷ Cương Số"
      campusName="Trường TH Phố Lu • Kỷ Cương & Niêm Phong"
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
        icon: isSecondPhase ? FileCheck2 : Lock,
        label: isSecondPhase
          ? "Phê Duyệt Kế Hoạch Bài Dạy Trực Tuyến"
          : "Sổ Đầu Bài Điện Tử & Niêm Phong 4 Cấp Bất Biến",
        value: isSecondPhase
          ? "Cắt Giảm 90% In Ấn • Ký Duyệt Mọi Lúc Mọi Nơi"
          : "100% Chống Sửa Đổi Tùy Tiện • Audit Log Bất Biến",
        subtext: "Dữ liệu thực tế qlthvn.com",
        badge: isSecondPhase ? "E-LESSON PLAN" : "4-TIER LOCK",
      }}
    />
  );
}
