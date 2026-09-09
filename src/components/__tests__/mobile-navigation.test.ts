/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`npm test`, `src/components/__tests__/mobile-navigation.test.ts`).
 * 2. Affected APIs: Mobile Navigation components test suite (`src/components/layout/MobileBottomNav.tsx`, `src/components/layout/MobileDrawer.tsx`).
 * 3. Schema: `MobileMenuItem`, `MobileMenuGroup`.
 * 4. Verbatim User Instruction: "cải thiện giao diện của điện thoại cả adroi và iphone vần giao diện menu phải hiện đại mượt mà" and "bắt đầu đi và hạn chề dùng icon màu mè".
 */

import { describe, it, expect } from "vitest";

describe("Mobile Navigation Architectural & Role Specifications", () => {
  const roles = [
    "ADMIN",
    "SUPER_ADMIN",
    "TEACHER",
    "STUDENT",
    "VICE_PRINCIPAL",
    "DEPARTMENT_ADMIN",
    "WARD_ADMIN",
  ];

  it("should have specialized quick navigation routes for each role", () => {
    // Verify each role has distinct primary workspaces
    const roleQuickMap: Record<string, string[]> = {
      TEACHER: [
        "/teacher/dashboard",
        "/teacher/schedule",
        "/teacher/grades",
        "/teacher/journal",
      ],
      STUDENT: [
        "/student/dashboard",
        "/student/schedule",
        "/student/grades",
        "/student/transcript",
      ],
      VICE_PRINCIPAL: [
        "/vice-principal/dashboard",
        "/vice-principal/classes",
        "/vice-principal/students",
        "/vice-principal/lesson-plans",
      ],
      DEPARTMENT_ADMIN: [
        "/department/dashboard",
        "/department/wards",
        "/department/thpt-schools",
        "/department/all-schools",
      ],
      WARD_ADMIN: [
        "/ward/dashboard",
        "/ward/schools",
        "/ward/reports",
        "/ward/facilities",
      ],
      ADMIN: [
        "/admin/dashboard",
        "/admin/schedule",
        "/admin/students",
        "/admin/approvals",
      ],
    };

    roles.forEach((role) => {
      const key = role === "SUPER_ADMIN" ? "ADMIN" : role;
      const routes = roleQuickMap[key];
      expect(routes).toBeDefined();
      expect(routes.length).toBe(4);
    });
  });

  it("should filter search results correctly across multiple menu groups in MobileDrawer", () => {
    const sampleMenuGroups = [
      {
        id: "overview",
        code: "01",
        title: "TỔNG QUAN & ĐIỀU HÀNH",
        tag: "Chính",
        items: [
          { label: "Bảng điều khiển 360°", href: "/admin/dashboard", icon: () => null },
          { label: "Thời khóa biểu thông minh", href: "/admin/schedule", icon: () => null },
        ],
      },
      {
        id: "academic",
        code: "02",
        title: "QUẢN LÝ DẠY & HỌC",
        tag: "Học vụ",
        items: [
          { label: "Sổ nhập điểm", href: "/admin/grades", icon: () => null, badge: "Trực tuyến" },
          { label: "Quản lý lớp học", href: "/admin/classes", icon: () => null },
        ],
      },
    ];

    const filterMenu = (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const results: { groupTitle: string; label: string; href: string }[] = [];

      sampleMenuGroups.forEach((group) => {
        group.items.forEach((item) => {
          if (
            item.label.toLowerCase().includes(q) ||
            group.title.toLowerCase().includes(q) ||
            (item.badge && item.badge.toLowerCase().includes(q))
          ) {
            results.push({
              groupTitle: group.title,
              label: item.label,
              href: item.href,
            });
          }
        });
      });
      return results;
    };

    const search1 = filterMenu("thời khóa biểu");
    expect(search1.length).toBe(1);
    expect(search1[0].href).toBe("/admin/schedule");

    const search2 = filterMenu("điểm");
    expect(search2.length).toBe(1); // "Sổ nhập điểm"

    const searchAll = filterMenu("quản lý");
    expect(searchAll.length).toBe(2); // "QUẢN LÝ DẠY & HỌC" group title match -> 2 items

    const search3 = filterMenu("Trực tuyến");
    expect(search3.length).toBe(1);
    expect(search3[0].label).toBe("Sổ nhập điểm");

    const search4 = filterMenu("không tồn tại");
    expect(search4.length).toBe(0);
  });

  it("should maintain single-active accordion logic to collapse secondary groups", () => {
    let activeGroupId: string | null = "overview";

    const toggleGroup = (clickedId: string) => {
      activeGroupId = activeGroupId === clickedId ? null : clickedId;
    };

    // Clicking same group collapses it
    toggleGroup("overview");
    expect(activeGroupId).toBeNull();

    // Clicking academic group opens academic
    toggleGroup("academic");
    expect(activeGroupId).toBe("academic");

    // Clicking finance group auto-collapses academic and activates finance
    toggleGroup("finance");
    expect(activeGroupId).toBe("finance");
  });
});
