"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  computeStudentJourney,
  createIntervention,
  approveIntervention,
  applyIntervention,
  trackInterventionOutcome,
} from "@/lib/student-journey";
import { TriggerSource, TrendLabel } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function fetchStudentJourneyDetails(studentId: string, subjectId?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        classRoom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            schoolId: true,
            campusId: true,
            school: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    // Compute journey metrics with linear regression & volatility
    const journeyResult = await computeStudentJourney(studentId, subjectId);

    // Fetch historical interventions
    const interventions = await prisma.interventionRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });

    // Fetch subjects taken in school
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Generate trendline points for chart: y = m * orderIndex + c
    const trendlinePoints =
      journeyResult.metrics && !journeyResult.metrics.isInsufficientData && journeyResult.metrics.slope !== null
        ? journeyResult.dataPoints.map((dp) => {
            const yPred =
              journeyResult.metrics.slope! * dp.x +
              journeyResult.metrics.intercept!;
            return {
              periodName: dp.periodName,
              orderIndex: dp.x,
              actualScore: dp.score,
              predictedScore: Math.round(yPred * 100) / 100,
            };
          })
        : [];

    return {
      student,
      journeyResult,
      trendlinePoints,
      interventions,
      subjects,
    };
  } catch (error) {
    console.error("Error in fetchStudentJourneyDetails:", error);
    return null;
  }
}

export async function handleCreateStudentIntervention({
  studentId,
  subjectId,
  category,
  actionPlan,
}: {
  studentId: string;
  subjectId?: string;
  category: string;
  actionPlan: string;
}) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classRoom: true },
    });
    if (!student) throw new Error("Không tìm thấy học sinh.");

    const schoolId = student.classRoom?.schoolId || ctx.schoolId || "";
    const campusId = student.classRoom?.campusId || ctx.campusId || "";

    const intervention = await createIntervention({
      schoolId,
      campusId,
      studentId,
      subjectId,
      triggeredBy: TriggerSource.TEACHER,
      trendLabelAtTrigger: TrendLabel.DECLINING,
      interventionType: category,
      note: actionPlan,
    });

    revalidatePath(`/teacher/students/${studentId}/journey`);
    return { success: true, intervention };
  } catch (error: any) {
    console.error("Error creating intervention:", error);
    return { success: false, error: error.message || "Lỗi tạo can thiệp." };
  }
}
