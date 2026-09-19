/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Calling files: `prisma/seed.ts` (lines 60-90), `src/app/api/db-seed/route.ts` (lines 55-85).
 * 2. Search Verification: No existing file serves this purpose; defines Trường Tiểu học Phố Lu and its 5 sub-campuses + central point.
 * 3. Schema Structure: `School` (departmentId, districtWardId, branchType, schoolType, name, address, phone, email), `Campus` (schoolId, name, address), `SchoolPoint` (campusId, name, address, managerName, phone, distanceKm), `CampusWardMap` (campusId, wardId).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "Nhà trường có 4 phân hiệu: Phân hiệu Sơn Hà 1, Sơn Hà 2, Sơn Hải, Phố Lu 3, 01 điểm trường: điểm trường An Tiến. đây mà 5 trường đây mà".
 */

import { PrismaClient, ManagementBranch, SchoolType } from "@prisma/client";

export interface CampusStructureItem {
  key: string;
  name: string;
  address: string;
  pointName: string;
  managerName: string;
  distanceKm: number;
  vpEmail: string;
  vpName: string;
  classCount: number;
}

export const CAMPUS_SPECS: CampusStructureItem[] = [
  {
    key: "TRUNG_TAM",
    name: "Điểm trường Trung tâm (Chính - Phố Lu)",
    address: "Khu trung tâm Phố Lu, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Giảng đường Trung tâm & Phòng Tin học - Ngoại ngữ",
    managerName: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    distanceKm: 0,
    vpEmail: "pht.trungtam@gmail.com",
    vpName: "ThS. Nguyễn Văn Trung (Phó Hiệu trưởng Trung tâm)",
    classCount: 20,
  },
  {
    key: "SON_HA_1",
    name: "Phân hiệu Sơn Hà 1",
    address: "Thôn Sơn Hà 1, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Nhà đa năng Phân hiệu Sơn Hà 1",
    managerName: "Thầy Nguyễn Văn Sơn",
    distanceKm: 3.5,
    vpEmail: "pht.sonha1@gmail.com",
    vpName: "Thầy Nguyễn Văn Sơn (Phó Hiệu trưởng phụ trách Sơn Hà 1)",
    classCount: 12,
  },
  {
    key: "SON_HA_2",
    name: "Phân hiệu Sơn Hà 2",
    address: "Thôn Sơn Hà 2, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Thư viện xanh Phân hiệu Sơn Hà 2",
    managerName: "Cô Hoàng Thị Hà",
    distanceKm: 5.2,
    vpEmail: "pht.sonha2@gmail.com",
    vpName: "Cô Hoàng Thị Hà (Phó Hiệu trưởng phụ trách Sơn Hà 2)",
    classCount: 10,
  },
  {
    key: "SON_HAI",
    name: "Phân hiệu Sơn Hải",
    address: "Thôn Sơn Hải, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Giảng đường & Sân chơi trải nghiệm Phân hiệu Sơn Hải",
    managerName: "Thầy Lê Văn Hải",
    distanceKm: 6.8,
    vpEmail: "pht.sonhai@gmail.com",
    vpName: "Thầy Lê Văn Hải (Phó Hiệu trưởng phụ trách Sơn Hải)",
    classCount: 10,
  },
  {
    key: "PHO_LU_3",
    name: "Phân hiệu Phố Lu 3",
    address: "Khu Phố Lu 3, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Không gian STEM Phân hiệu Phố Lu 3",
    managerName: "Cô Đặng Thị Lu",
    distanceKm: 4.1,
    vpEmail: "pht.pholu3@gmail.com",
    vpName: "Cô Đặng Thị Lu (Phó Hiệu trưởng phụ trách Phố Lu 3)",
    classCount: 8,
  },
  {
    key: "AN_TIEN",
    name: "Điểm trường An Tiến",
    address: "Thôn An Tiến, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Điểm trường lẻ vùng cao An Tiến",
    managerName: "Thầy Phạm Văn Tiến",
    distanceKm: 8.5,
    vpEmail: "pht.antien@gmail.com",
    vpName: "Thầy Phạm Văn Tiến (Phó Hiệu trưởng phụ trách Điểm An Tiến)",
    classCount: 2,
  },
];

export interface SchoolStructureResult {
  school: any;
  campuses: Array<{
    spec: CampusStructureItem;
    campus: any;
    schoolPoint: any;
  }>;
}

export async function seedSchoolStructure(
  prisma: PrismaClient,
  deptId: string,
  wardId: string
): Promise<SchoolStructureResult> {
  console.log("\n🏫 [3/6] Khởi tạo Trường Tiểu học Phố Lu và 5 Phân hiệu & Điểm trường...");

  const school = await prisma.school.create({
    data: {
      departmentId: deptId,
      districtWardId: wardId,
      branchType: ManagementBranch.WARD,
      schoolType: SchoolType.TIEU_HOC,
      name: "Trường Tiểu học Phố Lu",
      address: "Khu trung tâm Thị trấn Phố Lu, Xã Bảo Thắng, Tỉnh Lào Cai",
      phone: "0214-3862-234",
      email: "th.pholu.laocai@gmail.com",
    },
  });

  const createdCampuses = [];

  for (const spec of CAMPUS_SPECS) {
    const campus = await prisma.campus.create({
      data: {
        schoolId: school.id,
        name: spec.name,
        address: spec.address,
      },
    });

    const schoolPoint = await prisma.schoolPoint.create({
      data: {
        campusId: campus.id,
        name: spec.pointName,
        address: spec.address,
        managerName: spec.managerName,
        phone: "0214-3862-234",
        distanceKm: spec.distanceKm,
      },
    });

    await prisma.campusWardMap.create({
      data: {
        campusId: campus.id,
        wardId: wardId,
      },
    });

    createdCampuses.push({
      spec,
      campus,
      schoolPoint,
    });
  }

  return {
    school,
    campuses: createdCampuses,
  };
}
