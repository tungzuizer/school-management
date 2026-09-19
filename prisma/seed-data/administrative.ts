/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Calling files: `prisma/seed.ts` (lines 40-70) and `src/app/api/db-seed/route.ts` (lines 35-65).
 * 2. Search Verification: No existing file serves this purpose; replaces monolithic seed definitions.
 * 3. Schema Structure: `EducationDepartment` (name, code, address, phone, email), `DistrictWard` (name, code, address, phone, departmentId), `User` (name, email, password, role, isApproved, departmentId, districtWardId), `UserRoleScope` (userId, role, scopeType, scopeId).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "hãy xóa hết các dữ liệu cũ và thay bằng các dữ liệu mới của 5 phân hiệu này".
 */

import { PrismaClient, Role, ScopeType } from "@prisma/client";

export interface AdminHierarchyResult {
  deptLaoCai: any;
  wardBaoThang: any;
  wardCommuneBaoThang: any;
  superAdminVietnam: any;
}

export async function seedAdministrativeHierarchy(
  prisma: PrismaClient,
  standardPassword: string
): Promise<AdminHierarchyResult> {
  console.log("\n🏛️ [2/6] Khởi tạo Sở GD&ĐT Tỉnh Lào Cai và UBND Xã Bảo Thắng...");

  // 1. Sở GD&ĐT Tỉnh Lào Cai
  const deptLaoCai = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Tỉnh Lào Cai",
      code: "LC-SGDDT",
      address: "Đại lộ Trần Hưng Đạo, Phường Nam Cường, TP. Lào Cai, Tỉnh Lào Cai",
      phone: "0214-3840-025",
      email: "sogd.laocai@gmail.com",
    },
  });

  // 2. Phòng GD&ĐT Huyện Bảo Thắng
  const wardBaoThang = await prisma.districtWard.create({
    data: {
      departmentId: deptLaoCai.id,
      name: "Phòng Giáo dục và Đào tạo Huyện Bảo Thắng",
      code: "LC-BAOTHANG",
      address: "Thị trấn Phố Lu, Huyện Bảo Thắng, Tỉnh Lào Cai",
      phone: "0214-3862-245",
    },
  });

  // 3. UBND Xã Bảo Thắng (Quản lý trực tiếp theo Nghị quyết sắp xếp đơn vị hành chính)
  const wardCommuneBaoThang = await prisma.districtWard.create({
    data: {
      departmentId: deptLaoCai.id,
      name: "UBND Xã Bảo Thắng (Thị trấn Phố Lu)",
      code: "LC-XABAOTHANG",
      address: "Khu trung tâm hành chính Xã Bảo Thắng, Tỉnh Lào Cai",
      phone: "0214-3862-111",
    },
  });

  // 4. SuperAdmin Toàn Quốc
  const superAdminMain = await prisma.user.create({
    data: {
      name: "Ban Quản Trị Nền Tảng Giáo Dục Toàn Quốc (SuperAdmin)",
      email: "superadmin@gmail.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdminMain.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const superAdminVietnam = await prisma.user.create({
    data: {
      name: "Bộ Giáo Dục và Đào Tạo Việt Nam (SuperAdmin Toàn Quốc)",
      email: "superadmin.vietnam@gmail.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdminVietnam.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  // 5. Lãnh đạo Sở GD&ĐT Tỉnh Lào Cai
  const sogdLaoCaiUser = await prisma.user.create({
    data: {
      name: "Bà Dương Bích Nguyệt (Giám đốc Sở GD&ĐT Tỉnh Lào Cai)",
      email: "admin.sogd.laocai@gmail.com",
      password: standardPassword,
      role: Role.DEPARTMENT_ADMIN,
      isApproved: true,
      departmentId: deptLaoCai.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: sogdLaoCaiUser.id,
      role: Role.DEPARTMENT_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const sogdLaoCaiOffice = await prisma.user.create({
    data: {
      name: "Văn phòng Sở GD&ĐT Tỉnh Lào Cai",
      email: "sogd.laocai@gmail.com",
      password: standardPassword,
      role: Role.DEPARTMENT_ADMIN,
      isApproved: true,
      departmentId: deptLaoCai.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: sogdLaoCaiOffice.id,
      role: Role.DEPARTMENT_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  // 6. Trưởng phòng GD&ĐT Huyện Bảo Thắng
  const pgdBaoThangUser = await prisma.user.create({
    data: {
      name: "ThS. Bùi Thị Hải Vân (Trưởng phòng GD&ĐT Huyện Bảo Thắng)",
      email: "gd.baothang@gmail.com",
      password: standardPassword,
      role: Role.DISTRICT_ADMIN,
      isApproved: true,
      departmentId: deptLaoCai.id,
      districtWardId: wardBaoThang.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: pgdBaoThangUser.id,
      role: Role.DISTRICT_ADMIN,
      scopeType: ScopeType.WARD,
      scopeId: wardBaoThang.id,
    },
  });

  // 7. Lãnh đạo UBND Xã Bảo Thắng
  const ubndBaoThangUser = await prisma.user.create({
    data: {
      name: "Đ/c Chủ tịch UBND Xã Bảo Thắng",
      email: "ubnd.baothang@gmail.com",
      password: standardPassword,
      role: Role.WARD_ADMIN,
      isApproved: true,
      departmentId: deptLaoCai.id,
      districtWardId: wardCommuneBaoThang.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: ubndBaoThangUser.id,
      role: Role.WARD_ADMIN,
      scopeType: ScopeType.WARD,
      scopeId: wardCommuneBaoThang.id,
    },
  });

  return {
    deptLaoCai,
    wardBaoThang,
    wardCommuneBaoThang,
    superAdminVietnam,
  };
}
