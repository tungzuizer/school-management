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

export default function Scene3AuditLocking({ progress }: SceneProps) {
  // Toggle between Electronic Journals and Lesson Plans
  const isSecondPhase = progress > 0.55;
  const imageSrc = isSecondPhase
    ? "/screenshots/real_web/10_admin_lesson_plans.png"
    : "/screenshots/real_web/07_admin_journals.png";
  const urlPath = isSecondPhase ? "/admin/lesson-plans" : "/admin/journals";

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
    cursorLabel = "Thẩm Định 4 Cấp: GVBM ➔ GVCN ➔ PHT ➔ HT";
    isClicking = progress > 0.44 && progress < 0.5;
  } else if (progress < 0.8) {
    const t = (progress - 0.55) / 0.25;
    cursorX = 75 - t * 40; // moves to ~35 (Kế hoạch bài dạy)
    cursorLabel = "Phê Duyệt Kế Hoạch Bài Dạy (Giáo Án Số)";
    cursorY = 47 - t * 15; // moves to ~32
    isClicking = progress > 0.68 && progress < 0.74;
  } else {
    const t = (progress - 0.8) / 0.2;
    cursorX = 35 + t * 30; // moves to ~65 (Audit log)
    cursorY = 32 + t * 35; // moves to ~67
    cursorLabel = "Audit Lock Bất Biến Chống Sửa Số Liệu";
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
          title: "Quản Lý Kế Hoạch Bài Dạy & Giáo Án Số",
          badge: "DUYỆT TRỰC TUYẾN",
          description: "Tổ chuyên môn & Ban Giám Hiệu duyệt giáo án điện tử trực tuyến, chấm dứt in ấn hàng trăm trang giấy",
          color: "sky",
          visibleAfter: 0.58,
        },
        {
          id: "immutable-archive",
          x: 42,
          y: 74,
          title: "Lưu Trữ Minh Chứng Số Hóa",
          badge: "CHUẨN TT15/2024",
          description: "Tự động đồng bộ vào hồ sơ đánh giá chuẩn nghề nghiệp giáo viên hàng năm",
          color: "emerald",
          visibleAfter: 0.78,
        },
      ]
    : [
        {
          id: "journal-table",
          x: 18,
          y: 20,
          width: 64,
          height: 40,
          title: "Điểm Mạnh #3: Sổ Đầu Bài Số & Thẩm Định 4 Cấp",
          badge: "1 CHẠM TRÊN DI ĐỘNG",
          description: "Giáo viên ghi nhận nội dung giảng dạy, điểm danh, nề nếp và xếp loại tiết học chỉ trong 30 giây",
          color: "sky",
          visibleAfter: 0.1,
        },
        {
          id: "four-level-lock",
          x: 45,
          y: 62,
          width: 48,
          height: 30,
          title: "Khóa Niêm Phong Audit Lock 4 Cấp",
          badge: "BẢO MẬT BẤT BIẾN",
          description: "Quy trình chuẩn: GVBM ➔ GVCN ➔ PHT ➔ HT niêm phong, chống sửa số liệu sau khi hoàn tất",
          color: "purple",
          visibleAfter: 0.35,
        },
      ];

  return (
    <RealScreenViewer
      imageSrc={imageSrc}
      urlPath={urlPath}
      title="Sổ Đầu Bài Điện Tử & Kỷ Cương Số Hóa"
      campusName="Trường TH Phố Lu • Quản Lý Sổ Sách Số"
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
        icon: ShieldCheck,
        label: "Sổ Đầu Bài Số & Khóa Niêm Phong Audit Lock",
        value: "Thẩm Định 4 Cấp: GVBM ➔ GVCN ➔ PHT ➔ HT • Chống Sửa Dữ Liệu 100%",
        subtext: "Số hóa giáo án và sổ theo dõi",
        badge: "AUDIT LOCK 4 CẤP",
      }}
    />
  );
}
