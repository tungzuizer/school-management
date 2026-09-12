/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/admin/tt15-evaluation`, linked from `src/app/admin/layout.tsx`.
 * 2. Public functions/classes affected: `TT15EvaluationPage` default export.
 * 3. Data structures: `Campus` (`id`, `name`, `schoolId`), `SchoolPoint` (`id`, `name`, `campusId`), `Session` (`user.role`, `user.schoolId`, `user.campusId`).
 * 4. Verbatim User Instruction: "vẫn lỗi khôgn thể bấm vô mục thông tư 15 \"404 This page could not be found.\"" - "đánh giá TT15 lỗi 404 This page could not be found.".
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TT15EvaluationClient from "./TT15EvaluationClient";

export const metadata = {
  title: "Đánh Giá Theo Thông Tư 15 - KPI Chuyên Biệt",
};

export default async function TT15EvaluationPage(props: { searchParams?: Promise<{ campusId?: string; schoolPointId?: string; year?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const searchParams = await props.searchParams;

  const role = session.user.role;
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
  if (!allowedRoles.includes(role)) {
    redirect("/admin/dashboard");
  }

  // Fetch contextual user scope Data
  /** FACT-FORCING GATE CONTEXT: TT15 KPI framework. Vice Principals evaluate SchoolPoints, Principals evaluate Campuses. "phó hiệu trưởng đánh giá từng trường, hiệu trưởng đánh giá các trường ở trong phân hiệu của hiệu trưởng và phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15" */
  const schoolId = session.user.schoolId;
  const campusId = session.user.campusId;

  // Let's list the campuses & school points the user can manage
  const filter: any = {};
  if (schoolId) filter.schoolId = schoolId;
  if (campusId) filter.id = campusId; // Restrict VP and HT to their branch if set

  const campuses = await prisma.campus.findMany({
    where: filter,
    include: {
      schoolPoints: true,
    },
    orderBy: { name: "asc" },
  });

  const currentYear = searchParams?.year ? parseInt(searchParams.year) : new Date().getFullYear();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đánh giá theo Thông tư 15/2026/TT-BGDĐT</h1>
          <p className="text-slate-600">Khung đánh giá cấp Điểm trường (Phó Hiệu trưởng) lên Phân hiệu (Hiệu trưởng)</p>
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
