import { getHeadSubjectsAndRequests } from "./actions";
import SubjectHeadClient from "./SubjectHeadClient";

export const dynamic = "force-dynamic";

export default async function SubjectHeadPage() {
  const { headSubjects, requests } = await getHeadSubjectsAndRequests();
  return <SubjectHeadClient initialHeadSubjects={headSubjects as any} initialRequests={requests as any} />;
}
