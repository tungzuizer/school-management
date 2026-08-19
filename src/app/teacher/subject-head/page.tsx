import { getHeadSubjectsAndRequests, getHeadLessonPlans, checkIsSubjectHead } from "./actions";
import SubjectHeadClient from "./SubjectHeadClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SubjectHeadPage() {
  // Kiểm tra quyền: chỉ Tổ trưởng CM mới được truy cập
  const headCheck = await checkIsSubjectHead();
  if (!headCheck.isSubjectHead) {
    redirect("/teacher/dashboard");
  }

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
