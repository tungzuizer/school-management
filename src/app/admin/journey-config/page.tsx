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
