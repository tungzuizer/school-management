/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/vice-principal/tt15-evaluation`, linked from `src/app/vice-principal/layout.tsx`.
 * 2. Public functions/classes affected: `VicePrincipalTT15EvaluationPage` default export.
 * 3. Data structures: `Campus` (`id`, `name`, `schoolId`), `SchoolPoint` (`id`, `name`, `campusId`), `Session` (`user.role`, `user.schoolId`, `user.campusId`).
 * 4. Verbatim User Instruction: "vẫn lỗi khôgn thể bấm vô mục thông tư 15 \"404 This page could not be found.\"" - "đánh giá TT15 lỗi 404 This page could not be found.".
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TT15EvaluationClient from "@/app/admin/tt15-evaluation/TT15EvaluationClient";

export const metadata = {
  title: "Đánh Giá Theo Thông Tư 15 - Điểm Trường & Phân Hiệu",
};

export default async function VicePrincipalTT15EvaluationPage(props: {
  searchParams?: Promise<{ campusId?: string; schoolPointId?: string; year?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const searchParams = await props.searchParams;

  const role = session.user.role;
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
  if (!allowedRoles.includes(role)) {
    redirect("/vice-principal/dashboard");
  }

  const schoolId = session.user.schoolId;
  const campusId = session.user.campusId;

  // List the campuses & school points the VP can evaluate
  const filter: any = {};
  if (schoolId) filter.schoolId = schoolId;
  if (campusId) filter.id = campusId;

  const campuses = await prisma.campus.findMany({
    where: filter,
    include: {
      schoolPoints: true,
    },
    orderBy: { name: "asc" },
  });

  const currentYear = searchParams?.year ? parseInt(searchParams.year) : new Date().getFullYear();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Đánh giá theo Thông tư 15/2026/TT-BGDĐT
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Phó Hiệu trưởng tự đánh giá theo 5 tiêu chuẩn, 17 tiêu chí và đính kèm hồ sơ minh chứng trước khi nộp lên Hiệu trưởng.
          </p>
        </div>
      </div>

      <TT15EvaluationClient
        campuses={campuses}
        role={role}
        defaultYear={currentYear}
        userId={session.user.id}
      />
    </div>
  );
}
