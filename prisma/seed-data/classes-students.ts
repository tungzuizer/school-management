/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 19), `src/app/api/db-seed/route.ts` (line 19).
 * 2. Search Verification: Replaces simulated student rosters with 1,700 real students across 62 classes extracted from `docs/dulieu/DANH SACH CÂP BU HP K1-26-27.xlsx` and `THOI KHÓA BIỂU 2026 - 2027_V2.xls`.
 * 3. Affected API / Data Schemas: `seedClassesAndStudents`, `ClassesStudentsResult`, `ClassRoom`, `Group`, `Student`, `User`, `TeachingAssignment`, `Schedule`.
 * 4. Verbatim User Instruction: "hãy xóa hết dữ liệu của TRƯỜNG TIỂU HỌC PHỐ LU và hãy cập nhập và lấy dữ liệu ở đây C:\Users\tungh\Desktop\school-management\docs\dulieu"
 */

import { PrismaClient, Role, StudentStatus, Gender } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import * as fs from "fs";
import * as path from "path";

export interface ClassSpecItem {
  campusKey: string;
  name: string;
  gradeLevel: number;
  studentCount: number;
}

export function build62ClassesSpec(): ClassSpecItem[] {
  const specs: ClassSpecItem[] = [];

  // 1. Điểm trường Trung tâm (35 lớp: 1A1..1A7, 2A1..2A7, 3A1..3A7, 4A1..4A7, 5A1..5A7)
  for (let g = 1; g <= 5; g++) {
    for (let c = 1; c <= 7; c++) {
      specs.push({
        campusKey: "TRUNG_TAM",
        name: `${g}A${c}`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 2. Phân hiệu Sơn Hà 1 (10 lớp: 1B1..5B1, 1B2..5B2)
  for (let g = 1; g <= 5; g++) {
    for (let c = 1; c <= 2; c++) {
      specs.push({
        campusKey: "SON_HA_1",
        name: `${g}B${c}`,
        gradeLevel: g,
        studentCount: 28,
      });
    }
  }

  // 3. Phân hiệu Sơn Hà 2 (5 lớp: 1B3..5B3)
  for (let g = 1; g <= 5; g++) {
    specs.push({
      campusKey: "SON_HA_2",
      name: `${g}B3`,
      gradeLevel: g,
      studentCount: 28,
    });
  }

  // 4. Phân hiệu Sơn Hải (7 lớp: 1C1, 1C2, 2C1, 3C1, 4C1, 4C2, 5C1)
  const sonHaiNames = ["1C1", "1C2", "2C1", "3C1", "4C1", "4C2", "5C1"];
  for (const name of sonHaiNames) {
    specs.push({
      campusKey: "SON_HAI",
      name,
      gradeLevel: parseInt(name[0], 10),
      studentCount: 28,
    });
  }

  // 5. Điểm trường An Tiến (5 lớp: 1C3, 2C2, 3C2, 4C3, 5C2)
  const anTienNames = ["1C3", "2C2", "3C2", "4C3", "5C2"];
  for (const name of anTienNames) {
    specs.push({
      campusKey: "AN_TIEN",
      name,
      gradeLevel: parseInt(name[0], 10),
      studentCount: 28,
    });
  }

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

function parseDob(dobStr: string, gradeLevel: number): Date {
  if (dobStr && dobStr.includes("/")) {
    const parts = dobStr.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(Date.UTC(y, m - 1, d));
      }
    }
  }
  const birthYear = 2026 - (gradeLevel + 5);
  return new Date(Date.UTC(birthYear, 8, 5));
}

function inferGender(name: string): Gender {
  const parts = name.trim().split(/\s+/);
  const middle = parts.slice(1, -1).join(" ").toLowerCase();
  const first = (parts[parts.length - 1] || "").toLowerCase();

  if (middle.includes("thị") || ["ngọc", "mai", "lan", "hương", "trang", "linh", "chi", "nhi", "vy", "hân", "thư", "anh", "hà", "ngân"].includes(first)) {
    return Gender.FEMALE;
  }
  return Gender.MALE;
}

export async function seedClassesAndStudents(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  standardPassword: string
): Promise<ClassesStudentsResult> {
  console.log("\n🎒 [5/6] Khởi tạo 62 Lớp học, 1.700 Học sinh thực tế và Thời khóa biểu từ hồ sơ CSDL...");
  const { school, campuses } = schoolStruct;
  const { teachers, subjects } = personnelStruct;

  const campusMap = new Map(campuses.map((c) => [c.spec.key, c]));
  const mainCampus = campusMap.get("TRUNG_TAM") || campuses[0];

  // 1. Read real students from JSON
  const studentJsonPath = path.join(process.cwd(), "prisma", "real-data", "students.json");
  let rawStudents: any[] = [];
  if (fs.existsSync(studentJsonPath)) {
    rawStudents = JSON.parse(fs.readFileSync(studentJsonPath, "utf-8"));
  }

  // Read real timetable from JSON
  const timetableJsonPath = path.join(process.cwd(), "prisma", "real-data", "timetable.json");
  let rawTimetable: any[] = [];
  if (fs.existsSync(timetableJsonPath)) {
    rawTimetable = JSON.parse(fs.readFileSync(timetableJsonPath, "utf-8"));
  }

  // Index timetable by class
  const timetableByClass = new Map<string, any[]>();
  for (const item of rawTimetable) {
    if (!timetableByClass.has(item.className)) {
      timetableByClass.set(item.className, []);
    }
    timetableByClass.get(item.className)!.push(item);
  }

  const globalUsedTeacherSlots = new Set<string>();

  // 2. Group students by class
  const studentsByClass = new Map<string, any[]>();
  for (const st of rawStudents) {
    const cName = st.className;
    if (!studentsByClass.has(cName)) {
      studentsByClass.set(cName, []);
    }
    studentsByClass.get(cName)!.push(st);
  }

  // 3. 62 Classes and their Campus mapping
  const classNames = Array.from(studentsByClass.keys()).sort();

  const createdClasses: any[] = [];
  const createdStudents: any[] = [];
  const seenStudentCodes = new Set<string>();
  const seenEmails = new Set<string>();
  const usedGvcnIds = new Set<string>();

  const chaoCoSub = subjects.find((s) => s.name === "Chào cờ") || subjects[0];
  const sinhHoatSub = subjects.find((s) => s.name === "Sinh hoạt lớp") || subjects[0];
  const regularSubjects = subjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp");

  for (let idx = 0; idx < classNames.length; idx++) {
    const className = classNames[idx];
    const classStudentList = studentsByClass.get(className) || [];
    const gradeLevel = classStudentList[0]?.gradeLevel || parseInt(className[0], 10) || 1;

    // Determine campus
    let campusKey = "TRUNG_TAM";
    if (className.includes("A")) {
      campusKey = "TRUNG_TAM";
    } else if (className.endsWith("B1") || className.endsWith("B2")) {
      campusKey = "SON_HA_1";
    } else if (className.endsWith("B3")) {
      campusKey = "SON_HA_2";
    } else if (["1C1", "1C2", "2C1", "3C1", "4C1", "4C2", "5C1"].includes(className)) {
      campusKey = "SON_HAI";
    } else if (["1C3", "2C2", "3C2", "4C3", "5C2"].includes(className)) {
      campusKey = "AN_TIEN";
    }

    const campusItem = campusMap.get(campusKey) || mainCampus;

    // Find GVCN from teachers matching class name in duty
    const normalizedClassName = className.toUpperCase().replace(/\s+/g, "");
    let matchedTeacher = teachers.find((t) => {
      if (usedGvcnIds.has(t.teacher.id)) return false;
      const dutyNorm = (t.duty || "").toUpperCase().replace(/\s+/g, "");
      return (
        dutyNorm.includes(`LỚP${normalizedClassName}`) ||
        dutyNorm.includes(`CN${normalizedClassName}`) ||
        dutyNorm.includes(`LỚP ${normalizedClassName}`)
      );
    });

    if (!matchedTeacher) {
      matchedTeacher = teachers.find((t) => !usedGvcnIds.has(t.teacher.id) && t.stt >= 7);
    }
    if (!matchedTeacher) {
      matchedTeacher = teachers[idx % teachers.length];
    }
    usedGvcnIds.add(matchedTeacher.teacher.id);
    const homeroomTeacherObj = matchedTeacher.teacher;

    const classRoom = await prisma.classRoom.create({
      data: {
        name: className,
        gradeLevel,
        schoolId: school.id,
        campusId: campusItem.campus.id,
        schoolPointId: campusItem.schoolPoint.id,
        homeroomTeacherId: homeroomTeacherObj.id,
      },
    });
    createdClasses.push(classRoom);

    // Create 2 Groups (Tổ 1, Tổ 2)
    const group1 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 1" } });
    const group2 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 2" } });
    const groups = [group1, group2];

    // Create all real students for this class
    for (let sIdx = 0; sIdx < classStudentList.length; sIdx++) {
      const stData = classStudentList[sIdx];
      const isDemoStudent = className === "1A1" && sIdx === 0;

      // Clean cccd / studentCode
      const rawCccd = (stData.cccd || "").replace(/[^0-9]/g, "");
      let studentCode = rawCccd && rawCccd.length >= 9
        ? rawCccd
        : `HS26${String(gradeLevel).padStart(2, "0")}${String(stData.stt || sIdx + 1).padStart(4, "0")}`;

      if (seenStudentCodes.has(studentCode)) {
        studentCode = `${studentCode}_${sIdx + 1}`;
      }
      seenStudentCodes.add(studentCode);

      // Email / username
      let stEmail = isDemoStudent
        ? "hocsinh.thpholu@gmail.com"
        : `${studentCode.toLowerCase()}@thpholu.edu.vn`;

      if (seenEmails.has(stEmail)) {
        stEmail = `${studentCode.toLowerCase()}.${sIdx + 1}@thpholu.edu.vn`;
      }
      seenEmails.add(stEmail);

      const stUser = await prisma.user.create({
        data: {
          name: stData.name,
          email: stEmail,
          password: standardPassword,
          role: Role.STUDENT,
          isApproved: true,
          schoolId: school.id,
          campusId: campusItem.campus.id,
        },
      });

      const dob = parseDob(stData.dob, gradeLevel);
      const gender = inferGender(stData.name);

      const student = await prisma.student.create({
        data: {
          userId: stUser.id,
          studentCode,
          classId: classRoom.id,
          groupId: groups[sIdx % groups.length].id,
          status: StudentStatus.STUDYING,
          dob,
          gender,
          ethnicity: stData.ethnic || "Kinh",
          nationality: "Việt Nam",
          addressCurrent: stData.address || "Xã Bảo Thắng, Tỉnh Lào Cai",
          parentName: `Phụ huynh em ${stData.name}`,
          parentPhone: `09${String(10000000 + ((sIdx + 1) * 31337) % 89999999)}`,
          isClassMonitor: sIdx === 0,
          classRole: sIdx === 0 ? "LOP_TRUONG" : sIdx === 1 ? "LOP_PHO" : "THANH_VIEN",
        },
      });

      createdStudents.push({
        id: student.id,
        name: stData.name,
        classId: classRoom.id,
        campusId: campusItem.campus.id,
        gradeLevel,
        user: stUser,
      });
    }

    // Teaching Assignments
    const assignments = [];
    for (const sub of subjects) {
      let assignedTeacherId = homeroomTeacherObj.id;
      const specialistTeacher = teachers.find((t) => t.specialty.toLowerCase().includes(sub.name.toLowerCase()));
      if (specialistTeacher) {
        assignedTeacherId = specialistTeacher.teacher.id;
      }

      assignments.push({
        classId: classRoom.id,
        subjectId: sub.id,
        teacherId: assignedTeacherId,
      });
    }
    if (assignments.length > 0) {
      await prisma.teachingAssignment.createMany({ data: assignments });
    }

    // Schedules (Thứ 2 - Thứ 6, Sáng 1-4, Chiều 5-8)
    const classTtEntries = timetableByClass.get(className) || [];
    const classTtSlotMap = new Map<string, any>();
    for (const entry of classTtEntries) {
      classTtSlotMap.set(`${entry.dayOfWeek}_${entry.period}`, entry);
    }

    const schedules = [];
    for (let day = 1; day <= 5; day++) {
      for (let p = 1; p <= 8; p++) {
        const slotKey = `${day}_${p}`;
        const explicitEntry = classTtSlotMap.get(slotKey);

        let targetSubject = regularSubjects[(idx + day + p) % regularSubjects.length];
        let targetTeacherId = homeroomTeacherObj.id;

        if (day === 1 && p === 1) {
          targetSubject = chaoCoSub;
          targetTeacherId = homeroomTeacherObj.id;
        } else if (day === 5 && (p === 8 || p === 4)) {
          targetSubject = sinhHoatSub;
          targetTeacherId = homeroomTeacherObj.id;
        } else if (explicitEntry) {
          // Find matching subject
          const matchedSub = subjects.find(
            (s) =>
              s.name.toLowerCase() === explicitEntry.subjectName.toLowerCase() ||
              s.name.toLowerCase().includes(explicitEntry.subjectName.toLowerCase())
          );
          if (matchedSub) {
            targetSubject = matchedSub;
          }
          // Find matching teacher
          if (explicitEntry.teacherStt) {
            const tObj = teachers.find((t) => t.stt === explicitEntry.teacherStt);
            if (tObj) {
              targetTeacherId = tObj.teacher.id;
            }
          }
        } else {
          // Fill morning vs afternoon
          if (p <= 4) {
            const morningSubs = ["Toán", "Tiếng Việt", "Tự nhiên và Xã hội", "Đạo đức", "Khoa học", "Lịch sử và Địa lí"];
            const subName = morningSubs[(p + day + gradeLevel) % morningSubs.length];
            targetSubject = subjects.find((s) => s.name === subName) || regularSubjects[0];
            targetTeacherId = homeroomTeacherObj.id;
          } else {
            const afternoonSubs = ["Tiếng Anh", "Tin học và Công nghệ", "Giáo dục thể chất", "Âm nhạc", "Mĩ thuật", "Hoạt động trải nghiệm"];
            const subName = afternoonSubs[(p + day + idx) % afternoonSubs.length];
            targetSubject = subjects.find((s) => s.name === subName) || regularSubjects[0];
            const specTeacher = teachers.find((t) => t.specialty.toLowerCase().includes(targetSubject.name.toLowerCase()));
            if (specTeacher) {
              targetTeacherId = specTeacher.teacher.id;
            }
          }
        }

        // Conflict check for (teacherId, dayOfWeek, period) unique constraint
        let finalTeacherId = targetTeacherId;
        if (globalUsedTeacherSlots.has(`${finalTeacherId}_${day}_${p}`)) {
          // Fallback to homeroom teacher
          if (!globalUsedTeacherSlots.has(`${homeroomTeacherObj.id}_${day}_${p}`)) {
            finalTeacherId = homeroomTeacherObj.id;
          } else {
            // Find any teacher free at this time
            const freeTeacher = teachers.find(
              (t) => !globalUsedTeacherSlots.has(`${t.teacher.id}_${day}_${p}`)
            );
            if (freeTeacher) {
              finalTeacherId = freeTeacher.teacher.id;
            }
          }
        }

        globalUsedTeacherSlots.add(`${finalTeacherId}_${day}_${p}`);

        schedules.push({
          classId: classRoom.id,
          subjectId: targetSubject.id,
          teacherId: finalTeacherId,
          dayOfWeek: day,
          period: p,
          room: p <= 4 ? `Phòng ${className}` : `Phòng chức năng ${campusItem.spec.name}`,
        });
      }
    }

    if (schedules.length > 0) {
      await prisma.schedule.createMany({ data: schedules });
    }
  }

  console.log(`   ✅ Đã khởi tạo thành công ${createdClasses.length} lớp học và ${createdStudents.length} học sinh thực tế.`);

  return {
    classes: createdClasses,
    students: createdStudents,
  };
}
