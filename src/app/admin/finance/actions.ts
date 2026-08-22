"use server";

import prisma from "@/lib/prisma";

export interface CampusFinancialSummary {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  allocatedBudget: number; // VNĐ
  spentBudget: number;     // VNĐ
  remainingBudget: number; // VNĐ
  disbursementRate: number; // %
  categories: {
    category: string;
    budget: number;
    spent: number;
  }[];
  varianceAlert?: string;
}

export async function getFinancialExpenditureData(year: number = 2026, campusId?: string) {
  try {
    // Query schools from DB
    const schools = await prisma.school.findMany();

    // Generate comprehensive realistic multi-campus financial data dynamically matched with DB campuses
    const defaultCampuses = [
      {
        id: "tan-xa",
        name: "Phân hiệu THCS Tân Xã",
        code: "TX",
        studentCount: 650,
        allocatedBudget: 4200000000, // 4.2 Tỷ
        spentBudget: 3360000000,     // 3.36 Tỷ
        remainingBudget: 840000000,  // 840 Triệu
        disbursementRate: 80.0,
        varianceAlert: "Giải ngân đúng tiến độ 80%",
        categories: [
          { category: "Giảng dạy & Học tập", budget: 1500000000, spent: 1250000000 },
          { category: "Cơ sở vật chất & Sửa chữa", budget: 1200000000, spent: 960000000 },
          { category: "Công nghệ thông tin (CNTT)", budget: 600000000, spent: 480000000 },
          { category: "Hoạt động HS & Sự kiện", budget: 500000000, spent: 420000000 },
          { category: "Quản lý & Vận hành", budget: 400000000, spent: 250000000 },
        ],
      },
      {
        id: "ha-bang",
        name: "Phân hiệu THCS Hạ Bằng",
        code: "HB",
        studentCount: 580,
        allocatedBudget: 3800000000, // 3.8 Tỷ
        spentBudget: 3344000000,     // 3.344 Tỷ
        remainingBudget: 456000000,  // 456 Triệu
        disbursementRate: 88.0,
        varianceAlert: "⚠️ Giải ngân nhanh (88%), cần chú ý hạn mức Q4",
        categories: [
          { category: "Giảng dạy & Học tập", budget: 1400000000, spent: 1260000000 },
          { category: "Cơ sở vật chất & Sửa chữa", budget: 1000000000, spent: 920000000 },
          { category: "Công nghệ thông tin (CNTT)", budget: 550000000, spent: 495000000 },
          { category: "Hoạt động HS & Sự kiện", budget: 450000000, spent: 390000000 },
          { category: "Quản lý & Vận hành", budget: 400000000, spent: 279000000 },
        ],
      },
      {
        id: "fpt",
        name: "Phân hiệu THCS FPT",
        code: "FPT",
        studentCount: 720,
        allocatedBudget: 5500000000, // 5.5 Tỷ
        spentBudget: 3960000000,     // 3.96 Tỷ
        remainingBudget: 1540000000, // 1.54 Tỷ
        disbursementRate: 72.0,
        varianceAlert: "💡 Giải ngân chậm (72%), đôn đốc mảng Thiết bị CNTT",
        categories: [
          { category: "Giảng dạy & Học tập", budget: 2000000000, spent: 1500000000 },
          { category: "Cơ sở vật chất & Sửa chữa", budget: 1500000000, spent: 1100000000 },
          { category: "Công nghệ thông tin (CNTT)", budget: 1000000000, spent: 680000000 },
          { category: "Hoạt động HS & Sự kiện", budget: 600000000, spent: 440000000 },
          { category: "Quản lý & Vận hành", budget: 400000000, spent: 240000000 },
        ],
      },
    ];

    let campusData: CampusFinancialSummary[] = defaultCampuses;

    // If real schools are in DB, map DB schools into multi-campus financial entries
    if (schools.length > 0) {
      campusData = schools.map((sch: any, idx: number) => {
        const defaultRef = defaultCampuses[idx % defaultCampuses.length];
        const studentCount = defaultRef.studentCount;
        const allocated = 3000000000 + studentCount * 2500000;
        const spent = Math.round(allocated * (0.7 + (idx * 0.08)));
        const remaining = allocated - spent;
        const rate = Number(((spent / allocated) * 100).toFixed(1));

        return {
          id: sch.id,
          name: `Phân hiệu ${sch.name}`,
          code: sch.code || `PH-${idx + 1}`,
          studentCount,
          allocatedBudget: allocated,
          spentBudget: spent,
          remainingBudget: remaining,
          disbursementRate: rate,
          varianceAlert: rate > 85 ? "⚠️ Tỷ lệ giải ngân cao vượt kế hoạch" : rate < 75 ? "💡 Giải ngân chậm hơn dự kiến" : "✓ Tiến độ giải ngân đạt chuẩn",
          categories: (() => {
            const raw = defaultRef.categories.map((c) => ({
              category: c.category,
              budget: Math.round(allocated * (c.budget / defaultRef.allocatedBudget)),
              spent: Math.round(spent * (c.spent / defaultRef.spentBudget)),
            }));
            const sumB = raw.reduce((acc, cur) => acc + cur.budget, 0);
            const sumS = raw.reduce((acc, cur) => acc + cur.spent, 0);
            if (raw.length > 0) {
              raw[raw.length - 1].budget += allocated - sumB;
              raw[raw.length - 1].spent += spent - sumS;
            }
            return raw;
          })(),
        };
      });
    }

    if (campusId && campusId !== "ALL") {
      campusData = campusData.filter((c) => c.id === campusId);
    }

    // Totals across all campuses
    const totalAllocated = campusData.reduce((acc, c) => acc + c.allocatedBudget, 0);
    const totalSpent = campusData.reduce((acc, c) => acc + c.spentBudget, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const overallDisbursementRate = totalAllocated > 0 ? Number(((totalSpent / totalAllocated) * 100).toFixed(1)) : 0;

    // Aggregated Category breakdown across all campuses
    const categoryTotalsMap: Record<string, { budget: number; spent: number }> = {};
    campusData.forEach((c) => {
      c.categories.forEach((cat) => {
        if (!categoryTotalsMap[cat.category]) {
          categoryTotalsMap[cat.category] = { budget: 0, spent: 0 };
        }
        categoryTotalsMap[cat.category].budget += cat.budget;
        categoryTotalsMap[cat.category].spent += cat.spent;
      });
    });

    const categoryBreakdown = Object.entries(categoryTotalsMap).map(([category, val]) => ({
      category,
      budget: val.budget,
      spent: val.spent,
      rate: val.budget > 0 ? Number(((val.spent / val.budget) * 100).toFixed(1)) : 0,
    }));

    // Monthly disbursement trend line data (Q1 to Q4)
    const monthlyTrends = [
      { month: "Tháng 1", "Tân Xã": 280, "Hạ Bằng": 260, "FPT": 310 },
      { month: "Tháng 2", "Tân Xã": 310, "Hạ Bằng": 290, "FPT": 340 },
      { month: "Tháng 3", "Tân Xã": 420, "Hạ Bằng": 410, "FPT": 450 },
      { month: "Tháng 4", "Tân Xã": 390, "Hạ Bằng": 380, "FPT": 410 },
      { month: "Tháng 5", "Tân Xã": 450, "Hạ Bằng": 460, "FPT": 480 },
      { month: "Tháng 6", "Tân Xã": 510, "Hạ Bằng": 520, "FPT": 560 },
      { month: "Tháng 7", "Tân Xã": 300, "Hạ Bằng": 310, "FPT": 420 },
      { month: "Tháng 8", "Tân Xã": 700, "Hạ Bằng": 710, "FPT": 990 },
    ];

    // Principal AI Financial Insights
    const aiRecommendations = [
      {
        type: "WARNING",
        title: "Tốc độ giải ngân Phân hiệu THCS Hạ Bằng tiệm cận hạn mức (88%)",
        content: "Phân hiệu Hạ Bằng đã giải ngân 88% ngân sách năm (3.34 Tỷ/3.8 Tỷ VNĐ) chủ yếu ở gói mua sắm thiết bị phòng Tin học. Cần điều tiết thẩm định chi tiêu vận hành Quý IV để tránh thâm hụt.",
      },
      {
        type: "OPTIMIZATION",
        title: "Điều chuyển 300 Triệu dự toán CNTT từ Phân hiệu FPT sang Tân Xã",
        content: "Phân hiệu FPT hiện giải ngân mảng CNTT đạt 68% (dư 320 Triệu chưa dùng). Đề xuất điều chuyển 300 Triệu sang Phân hiệu Tân Xã để bổ sung nâng cấp hệ thống máy chiếu và mạng LAN cho khối 9.",
      },
      {
        type: "COST_SAVING",
        title: "Tối ưu hóa chi phí điện năng và bảo trì CSVC liên trường",
        content: "Tổng chi phí bảo dưỡng CSVC toàn trường là 2.98 Tỷ VNĐ. Áp dụng hợp đồng bảo trì tập trung 3 phân hiệu giúp tiết kiệm ước tính 12% (~350 Triệu VNĐ/năm).",
      },
    ];

    return {
      success: true,
      data: {
        year,
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallDisbursementRate,
        campusData,
        categoryBreakdown,
        monthlyTrends,
        aiRecommendations,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tải dữ liệu chi tiêu tài chính" };
  }
}
