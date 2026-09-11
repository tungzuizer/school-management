/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Architecture: TT15 Strict KPI Framework UI.
 * 2. Feature: Evaluation entry, review, and evidence storage requirement.
 * 3. Instructed by: "phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15".
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
  if (!session?.user) redirect("/auth/login");

  const searchParams = await props.searchParams;

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "VICE_PRINCIPAL") {
    redirect("/dashboard");
  }

  // Fetch contextual user scope Data
  const schoolId = session.user.schoolId;

  // Let's list the campuses & school points the user can manage
  const campuses = await prisma.campus.findMany({
    where: schoolId ? { schoolId } : {},
    include: {
      schoolPoints: true,
    }
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
