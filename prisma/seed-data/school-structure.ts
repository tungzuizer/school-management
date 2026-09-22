/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Calling files: `prisma/seed.ts` (lines 17, 31), `src/app/api/db-seed/route.ts`.
 * 2. Search Verification: Standardizes Trường Tiểu học Phố Lu and its 6 campuses/points according to real QĐ 01/QĐ-THPL.
 * 3. Schema Structure: `School`, `Campus`, `SchoolPoint`, `CampusWardMap`.
 * 4. Verbatim User Instruction: "hãy xóa hết dữ liệu của TRƯỜNG TIỂU HỌC PHỐ LU và hãy cập nhập và lấy dữ liệu ở đây C:\Users\tungh\Desktop\school-management\docs\dulieu"
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
    vpName: "Nguyễn Thị Tình (Phó Hiệu trưởng phụ trách Trung tâm)",
    classCount: 35,
  },
  {
    key: "SON_HA_1",
    name: "Phân hiệu Sơn Hà 1",
    address: "Thôn Sơn Hà 1, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Nhà đa năng Phân hiệu Sơn Hà 1",
    managerName: "Phạm Văn Đức (Phó Hiệu trưởng)",
    distanceKm: 3.5,
    vpEmail: "pht.sonha1@gmail.com",
    vpName: "Phạm Văn Đức (Phó Hiệu trưởng phụ trách Sơn Hà 1)",
    classCount: 10,
  },
  {
    key: "SON_HA_2",
    name: "Phân hiệu Sơn Hà 2",
    address: "Thôn Sơn Hà 2, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Thư viện xanh Phân hiệu Sơn Hà 2",
    managerName: "Vũ Quang Hữu (Phó Hiệu trưởng)",
    distanceKm: 5.2,
    vpEmail: "pht.sonha2@gmail.com",
    vpName: "Vũ Quang Hữu (Phó Hiệu trưởng phụ trách Sơn Hà 2)",
    classCount: 5,
  },
  {
    key: "SON_HAI",
    name: "Phân hiệu Sơn Hải",
    address: "Thôn Sơn Hải, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Giảng đường & Sân chơi trải nghiệm Phân hiệu Sơn Hải",
    managerName: "Vương Thị Lý (Phó Hiệu trưởng)",
    distanceKm: 6.8,
    vpEmail: "pht.sonhai@gmail.com",
    vpName: "Vương Thị Lý (Phó Hiệu trưởng phụ trách Sơn Hải)",
    classCount: 7,
  },
  {
    key: "AN_TIEN",
    name: "Điểm trường An Tiến",
    address: "Thôn An Tiến, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Điểm trường lẻ vùng cao An Tiến",
    managerName: "Vương Thị Lý (Phó Hiệu trưởng)",
    distanceKm: 8.5,
    vpEmail: "pht.antien@gmail.com",
    vpName: "Vương Thị Lý (Phó Hiệu trưởng phụ trách Điểm An Tiến)",
    classCount: 5,
  },
  {
    key: "TAN_THANH",
    name: "Phân hiệu Tân Thành",
    address: "Thôn Tân Thành, Xã Bảo Thắng, Tỉnh Lào Cai",
    pointName: "Khu Lớp học & Thư viện mở Phân hiệu Tân Thành",
    managerName: "Nguyễn Thị Nga (Phó Hiệu trưởng)",
    distanceKm: 4.5,
    vpEmail: "pht.tanthanh@gmail.com",
    vpName: "Nguyễn Thị Nga (Phó Hiệu trưởng phụ trách Tân Thành)",
    classCount: 0,
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
