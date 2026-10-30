/**
 * Seed module: Trường THCS Trần Phú (Phú Xuyên, Hà Nội)
 *
 * Tạo trường, campus, và toàn bộ 58 CBGVNV từ danh sách thật
 * (file staff-tranphu.json được trích xuất từ "danh sách Gmail CBGVNV.xlsx")
 *
 * Phân loại nhân sự:
 *   I. Cán bộ quản lý (CBQL): 3 người — Hiệu trưởng + 2 Phó Hiệu trưởng
 *  II. Giáo viên (GV): 40 người — dạy Ngữ văn, Toán, Tiếng Anh, Vật lý, Sinh, Hóa, Sử, Âm nhạc, GDTC, Tin, Mỹ thuật, Địa
 * III. Nhân viên biên chế (NV_BIEN_CHE): 6 người — Văn thư, Quản trị, Thiết bị, Thư viện, Y tế, Kế toán
 *  IV. Hợp đồng 111 (HD_111): 9 người — GV hợp đồng + Phục vụ + Bảo vệ
 */

import { PrismaClient, Role, ScopeType, ManagementBranch, SchoolType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

export interface TranPhuSeedResult {
  school: any;
  campus: any;
  principalUser: any;
  vpUsers: any[];
  teachers: Array<{
    user: any;
    teacher: any;
    name: string;
    specialty: string;
    stt: number;
    category: string;
  }>;
  staffUsers: any[];
}

interface StaffEntry {
  stt: number;
  name: string;
  birthDate: string;
  degree: string;
  position: string; // HT | PHT | GV | NV
  duty: string;
  gmail: string;
  phone: string;
  category: string; // CBQL | GV | NV_BIEN_CHE | HD_111
  note?: string;
}

/**
 * Resolve specialty label from duty string for THCS subjects.
 */
function resolveSpecialty(duty: string): string {
  const d = duty.toLowerCase().trim();
  if (d.includes("ngữ văn") || d.includes("văn")) return "Ngữ văn";
  if (d.includes("tiếng anh") || d.includes("ngoại ngữ")) return "Tiếng Anh";
  if (d.includes("toán")) return "Toán";
  if (d.includes("vật lý") || d.includes("vật lí")) return "Vật lý";
  if (d.includes("sinh học") || d.includes("sinh")) return "Sinh học";
  if (d.includes("hóa") && d.includes("địa")) return "Hóa học - Địa lý";
  if (d.includes("hóa")) return "Hóa học";
  if (d.includes("lịch sử") || d.includes("sử")) return "Lịch sử";
  if (d.includes("địa") && !d.includes("hóa")) return "Địa lý";
  if (d.includes("âm nhạc")) return "Âm nhạc";
  if (d.includes("gdtc") || d.includes("thể chất") || d.includes("thể dục")) return "GDTC";
  if (d.includes("tin học")) return "Tin học";
  if (d.includes("mỹ thuật") || d.includes("mĩ thuật")) return "Mỹ thuật";
  if (d.includes("gdcd") || d.includes("công dân")) return "GDCD";
  if (d.includes("công nghệ")) return "Công nghệ";
  // Staff roles
  if (d.includes("văn thư")) return "Nhân viên Văn thư";
  if (d.includes("quản trị")) return "Nhân viên Quản trị";
  if (d.includes("thiết bị")) return "Nhân viên Thiết bị";
  if (d.includes("thư viện")) return "Nhân viên Thư viện";
  if (d.includes("y tế")) return "Nhân viên Y tế";
  if (d.includes("kế toán")) return "Nhân viên Kế toán";
  if (d.includes("phục vụ")) return "Nhân viên Phục vụ";
  if (d.includes("bảo vệ")) return "Nhân viên Bảo vệ";
  if (d.includes("hiệu trưởng")) return "Cán bộ quản lý";
  return duty; // fallback: use the raw duty
}

/**
 * Determine which THCS subject group a teacher belongs to,
 * based on Vietnamese THCS curriculum subject grouping (Tổ chuyên môn).
 */
function resolveSubjectGroupIndex(specialty: string): number {
  const s = specialty.toLowerCase();
  // Tổ 0: Khoa học Xã hội (Ngữ văn, Lịch sử, Địa lý, GDCD)
  if (s.includes("ngữ văn") || s.includes("lịch sử") || s.includes("địa lý") || s.includes("gdcd") || s.includes("công dân")) return 0;
  // Tổ 1: Khoa học Tự nhiên (Toán, Vật lý, Hóa, Sinh, Công nghệ)
  if (s.includes("toán") || s.includes("vật lý") || s.includes("hóa") || s.includes("sinh") || s.includes("công nghệ")) return 1;
  // Tổ 2: Ngoại ngữ (Tiếng Anh)
  if (s.includes("tiếng anh") || s.includes("ngoại ngữ")) return 2;
  // Tổ 3: Năng khiếu & Thể chất (Âm nhạc, Mỹ thuật, GDTC, Tin học)
  if (s.includes("âm nhạc") || s.includes("mỹ thuật") || s.includes("gdtc") || s.includes("tin học") || s.includes("thể chất")) return 3;
  // Default
  return 0;
}

export async function seedTranPhuSchool(
  prisma: PrismaClient,
  deptId: string,
  wardId: string,
  standardPassword: string
): Promise<TranPhuSeedResult> {
  console.log("\n🏫 Khởi tạo Trường THCS Trần Phú (Phú Xuyên, Hà Nội)...");

  // ── 1. Read staff data ──
  const staffJsonPath = path.join(process.cwd(), "prisma", "real-data", "staff-tranphu.json");
  let staffList: StaffEntry[] = [];
  if (fs.existsSync(staffJsonPath)) {
    staffList = JSON.parse(fs.readFileSync(staffJsonPath, "utf-8"));
    console.log(`   📋 Đã đọc ${staffList.length} CBGVNV từ staff-tranphu.json`);
  } else {
    console.warn("   ⚠️ Không tìm thấy file staff-tranphu.json — bỏ qua seed THCS Trần Phú");
    // Return empty
    return {
      school: null, campus: null, principalUser: null,
      vpUsers: [], teachers: [], staffUsers: [],
    } as any;
  }

  // ── 2. Create School ──
  const school = await prisma.school.create({
    data: {
      departmentId: deptId,
      districtWardId: wardId,
      branchType: ManagementBranch.WARD,
      schoolType: SchoolType.THCS,
      name: "Trường THCS Trần Phú",
      address: "Xã Phú Xuyên, Huyện Phú Xuyên, TP. Hà Nội",
      phone: "024-3385-xxxx",
      email: "thcs.tranphu.phuxuyen@hanoi.edu.vn",
    },
  });
  console.log(`   ✅ Đã tạo trường: ${school.name} (ID: ${school.id})`);

  // ── 3. Create Campus (single campus for THCS) ──
  const campus = await prisma.campus.create({
    data: {
      schoolId: school.id,
      name: "Trường THCS Trần Phú (Cơ sở chính)",
      address: "Xã Phú Xuyên, Huyện Phú Xuyên, TP. Hà Nội",
    },
  });

  await prisma.schoolPoint.create({
    data: {
      campusId: campus.id,
      name: "Khu Giảng đường chính — THCS Trần Phú",
      address: "Xã Phú Xuyên, Huyện Phú Xuyên, TP. Hà Nội",
      managerName: "Nguyễn Kim Oanh (Hiệu trưởng)",
      phone: "0979928456",
      distanceKm: 0,
    },
  });

  await prisma.campusWardMap.create({
    data: { campusId: campus.id, wardId },
  });

  // ── 4. Create Subject Groups for THCS ──
  const subjectGroupDefs = [
    { name: "Tổ Khoa học Xã hội", desc: "Ngữ văn, Lịch sử, Địa lý, GDCD" },
    { name: "Tổ Khoa học Tự nhiên", desc: "Toán, Vật lý, Hóa học, Sinh học, Công nghệ" },
    { name: "Tổ Ngoại ngữ", desc: "Tiếng Anh, Ngoại ngữ" },
    { name: "Tổ Năng khiếu & Thể chất", desc: "Âm nhạc, Mỹ thuật, GDTC, Tin học" },
  ];

  const subjectGroups: any[] = [];
  for (const gDef of subjectGroupDefs) {
    const group = await prisma.subjectGroup.create({
      data: {
        schoolId: school.id,
        name: gDef.name,
        description: gDef.desc,
      },
    });
    subjectGroups.push(group);
  }

  // ── 5. Create all THCS Subjects ──
  const subjectDefs = [
    { name: "Ngữ văn", groupIdx: 0 },
    { name: "Lịch sử", groupIdx: 0 },
    { name: "Địa lý", groupIdx: 0 },
    { name: "GDCD", groupIdx: 0 },
    { name: "Toán", groupIdx: 1 },
    { name: "Vật lý", groupIdx: 1 },
    { name: "Hóa học", groupIdx: 1 },
    { name: "Sinh học", groupIdx: 1 },
    { name: "Công nghệ", groupIdx: 1 },
    { name: "Tiếng Anh", groupIdx: 2 },
    { name: "Âm nhạc", groupIdx: 3 },
    { name: "Mỹ thuật", groupIdx: 3 },
    { name: "GDTC", groupIdx: 3 },
    { name: "Tin học", groupIdx: 3 },
  ];

  const subjects: any[] = [];
  for (const sDef of subjectDefs) {
    const subject = await prisma.subject.create({
      data: {
        name: sDef.name,
        subjectGroupId: subjectGroups[sDef.groupIdx].id,
      },
    });
    subjects.push(subject);
  }

  // ── 6. Create Staff (Users + Teachers) ──
  let principalUser: any = null;
  const vpUsers: any[] = [];
  const createdTeachers: TranPhuSeedResult["teachers"] = [];
  const staffUsers: any[] = [];

  for (const staff of staffList) {
    const isPrincipal = staff.position === "HT";
    const isVicePrincipal = staff.position === "PHT";
    const isTeacher = staff.position === "GV";
    const isStaff = staff.position === "NV";

    // Determine role
    let role: Role = Role.TEACHER;
    if (isPrincipal) role = Role.ADMIN;
    else if (isVicePrincipal) role = Role.VICE_PRINCIPAL;

    // Build email — use gmail from Excel if available, otherwise generate
    let email = staff.gmail && staff.gmail.trim() ? staff.gmail.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      // Generate fallback email
      const cleanName = staff.name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "");
      email = `${cleanName}@thcstranphu.edu.vn`;
    }

    // Build display name with role context
    const specialty = resolveSpecialty(staff.duty);
    let displayName = staff.name;
    if (isPrincipal) displayName = `${staff.name} (Hiệu trưởng THCS Trần Phú)`;
    else if (isVicePrincipal) displayName = `${staff.name} (Phó Hiệu trưởng THCS Trần Phú)`;
    else if (isStaff) displayName = `${staff.name} (${specialty})`;

    // Create User
    const user = await prisma.user.create({
      data: {
        name: displayName,
        email,
        password: standardPassword,
        role,
        isApproved: true,
        schoolId: school.id,
        campusId: campus.id,
      },
    });

    // Create Teacher record (for all roles — needed for teaching assignments, journal, etc.)
    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        specialty,
        phone: staff.phone || undefined,
        degree: staff.degree || undefined,
      },
    });

    // Create UserRoleScope
    if (isPrincipal) {
      await prisma.userRoleScope.create({
        data: {
          userId: user.id,
          role: Role.ADMIN,
          scopeType: ScopeType.GLOBAL,
        },
      });
      principalUser = user;
    } else if (isVicePrincipal) {
      await prisma.userRoleScope.create({
        data: {
          userId: user.id,
          role: Role.VICE_PRINCIPAL,
          scopeType: ScopeType.CAMPUS,
          scopeId: campus.id,
        },
      });
      vpUsers.push(user);
    }

    // Assign teacher to subject group
    if (isTeacher || isPrincipal || isVicePrincipal) {
      const groupIdx = resolveSubjectGroupIndex(specialty);
      await prisma.userRoleScope.create({
        data: {
          userId: user.id,
          role: Role.TEACHER,
          scopeType: ScopeType.SUBJECT_GROUP,
          subjectGroupId: subjectGroups[groupIdx].id,
        },
      });
    }

    if (isTeacher || isPrincipal || isVicePrincipal) {
      createdTeachers.push({
        user,
        teacher,
        name: staff.name,
        specialty,
        stt: staff.stt,
        category: staff.category,
      });
    }

    if (isStaff) {
      staffUsers.push(user);
    }
  }

  // Summary
  const cbqlCount = staffList.filter((s) => s.category === "CBQL").length;
  const gvCount = staffList.filter((s) => s.category === "GV").length;
  const nvCount = staffList.filter((s) => s.category === "NV_BIEN_CHE").length;
  const hdCount = staffList.filter((s) => s.category === "HD_111").length;

  console.log(`   ✅ Đã tạo ${staffList.length} CBGVNV cho THCS Trần Phú:`);
  console.log(`      - CBQL: ${cbqlCount} (Hiệu trưởng + ${cbqlCount - 1} PHT)`);
  console.log(`      - Giáo viên: ${gvCount}`);
  console.log(`      - Nhân viên biên chế: ${nvCount}`);
  console.log(`      - Hợp đồng 111: ${hdCount}`);
  console.log(`   ✅ Đã tạo ${subjectGroups.length} Tổ chuyên môn và ${subjects.length} Môn học THCS`);

  return {
    school,
    campus,
    principalUser,
    vpUsers,
    teachers: createdTeachers,
    staffUsers,
  };
}
