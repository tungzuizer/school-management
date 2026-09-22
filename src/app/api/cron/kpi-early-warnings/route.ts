/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: External Cron schedulers (Vercel Cron / GitHub Actions / Worker), Admin health checkers
 * 2. Public API: GET /api/cron/kpi-early-warnings, POST /api/cron/kpi-early-warnings
 * 3. Data Schemas: batchScanAllCampusesKpiAndEarlyWarnings result payload
 * 4. Verbatim User Instruction: "hãy cập nhập thêm phần KPI của hiểu trưởng để theo dõi các trường" - "theo khuyến nghị của bạn"
 */

import { NextResponse } from "next/server";
import { batchScanAllCampusesKpiAndEarlyWarnings } from "@/app/admin/kpi/principal-actions";

/**
 * Endpoint kích hoạt tác vụ quét tự động đánh giá KPI & Cảnh báo sớm định kỳ
 * Có thể được gọi bởi Vercel Cron, GitHub Actions hoặc Scheduled Worker
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const authHeader = req.headers.get("authorization");

    const expectedSecret =
      process.env.CRON_SECRET ||
      process.env.SEED_SECRET ||
      (process.env.NODE_ENV !== "production" ? "cron123" : undefined);

    const isBearerValid = authHeader && authHeader === `Bearer ${expectedSecret}`;
    const isQueryValid = secret && secret === expectedSecret;

    if (
      process.env.NODE_ENV === "production" &&
      (!expectedSecret || (!isBearerValid && !isQueryValid))
    ) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing secret token" }, { status: 401 });
    }

    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const result = await batchScanAllCampusesKpiAndEarlyWarnings({
      year,
      autoDispatchWarnings: true,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Lỗi trong quá trình quét tự động KPI",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: result.message,
      data: {
        scannedCount: result.scannedEntitiesCount,
        warningsCreated: result.totalWarningsCreated,
        scanResults: result.scanResults,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[CRON KPI Early Warnings Error]:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
