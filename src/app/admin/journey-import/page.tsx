import { getImportContextData, listRecentBatches } from "./actions";
import JourneyImportClient from "./import-client";

export const metadata = {
  title: "Import Điểm Số & Chuẩn Hóa Dữ Liệu | Quản trị",
  description: "Quy trình Staging & Auto-Mapping đa tầng, cổng bảo vệ kiểm duyệt người thật (Human Gate) và Rollback an toàn",
};

export default async function JourneyImportPage() {
  // Load default school & campuses
  const contextData = await getImportContextData("");
  const defaultSchoolId = contextData.schools[0]?.id || "";

  // Load contextual data for the default school
  const [enrichedContext, initialBatches] = await Promise.all([
    getImportContextData(defaultSchoolId),
    defaultSchoolId ? listRecentBatches(defaultSchoolId) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <JourneyImportClient
          initialBatches={initialBatches}
          contextData={enrichedContext}
          currentSchoolId={defaultSchoolId}
        />
      </div>
    </div>
  );
}
