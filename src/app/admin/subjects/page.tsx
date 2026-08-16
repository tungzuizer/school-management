import { getSubjects, getTeachersList } from "./actions";
import SubjectsClient from "./SubjectsClient";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [subjects, teachers] = await Promise.all([
    getSubjects(),
    getTeachersList()
  ]);

  return <SubjectsClient initialSubjects={subjects as any} initialTeachers={teachers as any} />;
}
