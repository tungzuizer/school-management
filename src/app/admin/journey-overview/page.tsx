/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin router for `/admin/journey-overview`.
 * 2. Affected APIs: `JourneyOverviewPage` redirecting to unified `/admin/exam-analytics`.
 * 3. Schemas: None.
 * 4. Verbatim User Instruction: "gộp lại đi" - Hợp nhất toàn bộ phân tích điểm thi và hành trình OLS vào `/admin/exam-analytics`.
 */

import { redirect } from "next/navigation";

export default function JourneyOverviewPage() {
  redirect("/admin/exam-analytics?tab=journey");
}
