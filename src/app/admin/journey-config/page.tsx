/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin router for `/admin/journey-config`.
 * 2. Affected APIs: `JourneyConfigPage`, `getSchoolsList`, `fetchCampusConfig`.
 * 3. Schemas: `School`, `Campus`, `StudentJourneyConfig`.
 * 4. Verbatim User Instruction: "hãy là như 1 chuyên gia phần mềm hãy kiểm tra thật kỹ logic hoạt động và luồng xử lý và tất cả mọi thứ để phần mềm hoạt động mượt mà".
 */

export const dynamic = "force-dynamic";

import { getSchoolsList, fetchCampusConfig } from "./actions";
import JourneyConfigClient from "./config-client";

export const metadata = {
  title: "Cấu hình Ngưỡng Hành trình Học sinh | Quản trị",
  description: "Cấu hình tham số mô hình hồi quy tuyến tính học lực theo cơ sở",
};

export default async function JourneyConfigPage() {
  const schools = await getSchoolsList();
  const defaultSchoolId = schools[0]?.id || "";
  const initialConfig = defaultSchoolId
    ? await fetchCampusConfig(defaultSchoolId)
    : {
        increasingSlope: 0.25,
        decliningSlope: -0.25,
        volatilityMax: 1.2,
        minPeriodsRequired: 3,
      };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <JourneyConfigClient
        initialConfig={
          initialConfig || {
            increasingSlope: 0.25,
            decliningSlope: -0.25,
            volatilityMax: 1.2,
            minPeriodsRequired: 3,
          }
        }
        schools={schools}
        currentSchoolId={defaultSchoolId}
      />
    </div>
  );
}
