"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeStudentJourney } from "@/lib/student-journey";

export async function fetchCurrentStudentJourney(subjectId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true, email: true } },
        classRoom: {
          select: {
            id: true,
            name: true,
            school: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!student) return null;

    const journeyResult = await computeStudentJourney(student.id, subjectId);

    // Fetch active action goals & applied interventions from teachers/school
    const interventions = await prisma.interventionRecord.findMany({
      where: {
        studentId: student.id,
        status: { in: ["APPROVED", "APPLIED", "OUTCOME_TRACKED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Subjects
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Form friendly trendline points
    const trendlinePoints =
      journeyResult.metrics && !journeyResult.metrics.isInsufficientData
        ? journeyResult.dataPoints.map((dp) => {
            const yPred =
              journeyResult.metrics.slope * dp.x +
              journeyResult.metrics.intercept;
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
    console.error("Error in fetchCurrentStudentJourney:", error);
    return null;
  }
}
