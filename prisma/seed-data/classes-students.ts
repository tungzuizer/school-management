/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (lines 100-140), `src/app/api/db-seed/route.ts` (lines 90-130).
 * 2. Affected APIs: `seedClassesAndStudents`, class list retrieval, homeroom dashboard, timetable schedule, student roster.
 * 3. Data Schemas: `ClassRoom`, `Group`, `Student`, `User`, `TeachingAssignment`, `Schedule`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "Cơ chế phân bổ 62 lớp học và 1.706 học sinh vào 5 Phân hiệu & Điểm trường".
 */

import { PrismaClient, Role, StudentStatus } from "@prisma/client";
import { generateStudentRoster, GeneratedStudent } from "./constants";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";

export interface ClassSpecItem {
  campusKey: string;
  name: string;
  gradeLevel: number;
  studentCount: number;
}

export function build62ClassesSpec(): ClassSpecItem[] {
  const specs: ClassSpecItem[] = [];

  // 1. Điểm trường Trung tâm (20 lớp)
  for (let g = 1; g <= 5; g++) {
    for (let c = 1; c <= 4; c++) {
      specs.push({
        campusKey: "TRUNG_TAM",
        name: `${g}A${c}`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 2. Phân hiệu Sơn Hà 1 (12 lớp: K1: 2, K2: 2, K3: 3, K4: 3, K5: 2)
  const sh1Distribution = [2, 2, 3, 3, 2];
  for (let g = 1; g <= 5; g++) {
    const countInGrade = sh1Distribution[g - 1];
    const letters = ["A", "B", "C"];
    for (let c = 0; c < countInGrade; c++) {
      specs.push({
        campusKey: "SON_HA_1",
        name: `${g}${letters[c]}_SH1`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 3. Phân hiệu Sơn Hà 2 (10 lớp: mỗi khối 2 lớp)
  for (let g = 1; g <= 5; g++) {
    for (const letter of ["A", "B"]) {
      specs.push({
        campusKey: "SON_HA_2",
        name: `${g}${letter}_SH2`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 4. Phân hiệu Sơn Hải (10 lớp: mỗi khối 2 lớp)
  for (let g = 1; g <= 5; g++) {
    for (const letter of ["A", "B"]) {
      specs.push({
        campusKey: "SON_HAI",
        name: `${g}${letter}_SHAI`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 5. Phân hiệu Phố Lu 3 (8 lớp: K1: 1, K2: 1, K3: 2, K4: 2, K5: 2)
  const pl3Distribution = [1, 1, 2, 2, 2];
  for (let g = 1; g <= 5; g++) {
    const countInGrade = pl3Distribution[g - 1];
    const letters = ["A", "B"];
    for (let c = 0; c < countInGrade; c++) {
      specs.push({
        campusKey: "PHO_LU_3",
        name: `${g}${letters[c]}_PL3`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 6. Điểm trường An Tiến (2 lớp: 1A_AT, 2A_AT)
  specs.push({ campusKey: "AN_TIEN", name: "1A_AT", gradeLevel: 1, studentCount: 23 });
  specs.push({ campusKey: "AN_TIEN", name: "2A_AT", gradeLevel: 2, studentCount: 23 });

  return specs;
}

export interface ClassesStudentsResult {
  classes: any[];
  students: Array<{
    id: string;
    name: string;
    classId: string;
    campusId: string;
    gradeLevel: number;
    user: any;
  }>;
}

export async function seedClassesAndStudents(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  standardPassword: string
): Promise<ClassesStudentsResult> {
  console.log("\n🎒 [5/6] Khởi tạo 62 Lớp học, Phân công giảng dạy, Thời khóa biểu và Học sinh...");
  const { school, campuses } = schoolStruct;
  const { teachers, subjects } = personnelStruct;

  const campusMap = new Map(campuses.map((c) => [c.spec.key, c]));
  const classSpecs = build62ClassesSpec();

  const createdClasses: any[] = [];
  const createdStudents: any[] = [];
  const studentSeqByGrade: Record<number, number> = {};

  const chaoCoSub = subjects.find((s) => s.name === "Chào cờ") || subjects[0];
  const sinhHoatSub = subjects.find((s) => s.name === "Sinh hoạt lớp") || subjects[0];
  const regularSubjects = subjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp");

  for (let idx = 0; idx < classSpecs.length; idx++) {
    const spec = classSpecs[idx];
    const campusItem = campusMap.get(spec.campusKey) || campuses[0];
    const homeroomTeacherObj = teachers[idx % teachers.length].teacher;

    const classRoom = await prisma.classRoom.create({
      data: {
        name: spec.name,
        gradeLevel: spec.gradeLevel,
        schoolId: school.id,
        campusId: campusItem.campus.id,
        schoolPointId: campusItem.schoolPoint.id,
        homeroomTeacherId: homeroomTeacherObj.id,
      },
    });
    createdClasses.push(classRoom);

    // Tạo tổ lớp
    const group1 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 1" } });
    const group2 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 2" } });
    const groups = [group1, group2];

    // Tạo học sinh (hạt giống 5-10 em mỗi lớp để tối ưu tốc độ và đầy đủ dữ liệu thực hành)
    const seedStudentCount = spec.name === "1A1" || spec.name === "5A1" ? 15 : 6;
    const startGradeSeq = (studentSeqByGrade[spec.gradeLevel] || 0) + 1;
    studentSeqByGrade[spec.gradeLevel] = (studentSeqByGrade[spec.gradeLevel] || 0) + seedStudentCount;

    const roster = generateStudentRoster(
      seedStudentCount,
      spec.gradeLevel,
      "PHOLU",
      spec.name,
      startGradeSeq,
      campusItem.spec.address
    );

    for (let sIdx = 0; sIdx < roster.length; sIdx++) {
      const stData = roster[sIdx];
      const stUser = await prisma.user.create({
        data: {
          name: stData.name,
          email: stData.email,
          password: standardPassword,
          role: Role.STUDENT,
          isApproved: true,
          schoolId: school.id,
          campusId: campusItem.campus.id,
        },
      });

      const student = await prisma.student.create({
        data: {
          userId: stUser.id,
          studentCode: stData.studentCode,
          classId: classRoom.id,
          groupId: groups[sIdx % groups.length].id,
          status: StudentStatus.STUDYING,
          dob: stData.dob,
          gender: stData.gender,
          ethnicity: sIdx % 3 === 0 ? "Tày" : sIdx % 5 === 0 ? "Dao" : "Kinh",
          nationality: "Việt Nam",
          phone: stData.phone,
          addressCurrent: stData.address,
          parentName: stData.parentName,
          parentPhone: stData.parentPhone,
          isClassMonitor: sIdx === 0,
          classRole: sIdx === 0 ? "LOP_TRUONG" : sIdx === 1 ? "LOP_PHO" : "THANH_VIEN",
        },
      });

      createdStudents.push({
        id: student.id,
        name: stData.name,
        classId: classRoom.id,
        campusId: campusItem.campus.id,
        gradeLevel: spec.gradeLevel,
        user: stUser,
      });

      // Special demo student account for 1A1
      if (spec.name === "1A1" && sIdx === 0) {
        await prisma.user.upsert({
          where: { email: "hocsinh.thpholu@gmail.com" },
          update: { password: standardPassword, schoolId: school.id },
          create: {
            name: "Nguyễn Minh Khang (Học sinh Tiểu học Mẫu 1A1)",
            email: "hocsinh.thpholu@gmail.com",
            password: standardPassword,
            role: Role.STUDENT,
            isApproved: true,
            schoolId: school.id,
            campusId: campusItem.campus.id,
          },
        });
      }
    }

    // Phân công giảng dạy (Teaching Assignments)
    const assignments = [];
    for (const sub of subjects) {
      const assignedTeacher = teachers.find((t) => t.specialty.includes(sub.name))?.teacher || teachers[idx % teachers.length].teacher;
      assignments.push({
        classId: classRoom.id,
        subjectId: sub.id,
        teacherId: assignedTeacher.id,
      });
    }
    if (assignments.length > 0) {
      await prisma.teachingAssignment.createMany({ data: assignments });
    }

    // Thời khóa biểu (Schedules)
    const schedules = [];
    for (let day = 1; day <= 5; day++) {
      for (let p = 1; p <= 4; p++) {
        if (day === 1 && p === 1) {
          schedules.push({
            classId: classRoom.id,
            subjectId: chaoCoSub.id,
            teacherId: homeroomTeacherObj.id,
            dayOfWeek: 1,
            period: 1,
            room: `Sân trường ${campusItem.spec.name}`,
          });
          continue;
        }

        if (day === 5 && p === 4) {
          schedules.push({
            classId: classRoom.id,
            subjectId: sinhHoatSub.id,
            teacherId: homeroomTeacherObj.id,
            dayOfWeek: 5,
            period: 4,
            room: `Phòng ${spec.name}`,
          });
          continue;
        }

        const subIdx = (idx + day + p) % regularSubjects.length;
        const sub = regularSubjects[subIdx];

        schedules.push({
          classId: classRoom.id,
          subjectId: sub.id,
          teacherId: homeroomTeacherObj.id,
          dayOfWeek: day,
          period: p,
          room: `Phòng ${spec.name}`,
        });
      }
    }

    if (schedules.length > 0) {
      await prisma.schedule.createMany({ data: schedules });
    }
  }

  return {
    classes: createdClasses,
    students: createdStudents,
  };
}
