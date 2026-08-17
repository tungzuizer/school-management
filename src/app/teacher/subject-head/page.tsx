import { getHeadSubjectsAndRequests, getHeadLessonPlans } from "./actions";
import SubjectHeadClient from "./SubjectHeadClient";

export const dynamic = "force-dynamic";

export default async function SubjectHeadPage() {
  const [{ headSubjects, requests }, lessonPlans] = await Promise.all([
    getHeadSubjectsAndRequests(),
    getHeadLessonPlans(),
  ]);
  return (
    <SubjectHeadClient
      initialHeadSubjects={headSubjects as any}
      initialRequests={requests as any}
      initialLessonPlans={lessonPlans as any}
    />
  );
}
