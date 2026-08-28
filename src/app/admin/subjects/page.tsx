import { getSubjects, getTeachersList, getPrincipalSchoolInfo } from "./actions";
import SubjectsClient from "./SubjectsClient";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [subjects, teachers, schoolInfo] = await Promise.all([
    getSubjects(),
    getTeachersList(),
    getPrincipalSchoolInfo(),
  ]);

  return (
    <SubjectsClient
      initialSubjects={subjects as any}
      initialTeachers={teachers as any}
      schoolInfo={schoolInfo}
    />
  );
}
