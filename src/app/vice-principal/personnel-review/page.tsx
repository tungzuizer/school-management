import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import ReviewWorkspace from "@/components/personnel-review/ReviewWorkspace";
import { getPersonnelReviewWorkspace } from "@/app/admin/personnel-review/actions";

export const metadata = { title: "Rà soát công việc và nhân sự" };

export default async function VicePersonnelReviewPage() {
  const ctx = await getTenantContext();
  if (ctx.userRole !== "VICE_PRINCIPAL" || ctx.isApproved === false || !ctx.schoolId) redirect("/unauthorized");
  const initial = await getPersonnelReviewWorkspace();
  return <ReviewWorkspace initial={initial} />;
}
