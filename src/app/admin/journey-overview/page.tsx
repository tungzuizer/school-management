import { getSchoolsAndCampuses, fetchJourneyOverviewData } from "./actions";
import JourneyOverviewClient from "./overview-client";

export const metadata = {
  title: "Hành trình học sinh & Radar Can thiệp | Quản trị",
  description: "Tổng quan phân tích học lực theo thời gian và quản trị can thiệp",
};

export default async function JourneyOverviewPage() {
  const schools = await getSchoolsAndCampuses();
  const defaultSchoolId = schools[0]?.id;
  const initialData = await fetchJourneyOverviewData(defaultSchoolId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <JourneyOverviewClient
          initialData={initialData}
          schools={schools}
          currentSchoolId={defaultSchoolId}
        />
      </div>
    </div>
  );
}
