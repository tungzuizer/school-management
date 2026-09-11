"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface RegisterTeacherInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "TEACHER" | "ADMIN" | "VICE_PRINCIPAL";
  isIndependentTeacher?: boolean;
  schoolId?: string;
  newSchoolName?: string;
  provinceName?: string;
  districtName?: string;
  districtWardId?: string;
  departmentId?: string;
  specialty?: string;
}

export async function getRegistrationFormData() {
  try {
    const [departments, districtWards, schools, subjects] = await Promise.all([
      prisma.educationDepartment.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.districtWard.findMany({
        select: { id: true, name: true, departmentId: true },
        orderBy: { name: "asc" },
      }),
      prisma.school.findMany({
        select: {
          id: true,
          name: true,
          departmentId: true,
          districtWardId: true,
          districtWard: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.subject.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      departments,
      districtWards,
      schools,
      subjects,
    };
  } catch (error: any) {
    console.error("Error in getRegistrationFormData:", error);
    return {
      success: false,
      departments: [],
      districtWards: [],
      schools: [],
      subjects: [],
      error: "Không thể tải danh sách trường học và khu vực.",
    };
  }
}

export async function registerTeacher(input: RegisterTeacherInput) {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "TEACHER",
      isIndependentTeacher = false,
      schoolId,
      newSchoolName,
      provinceName,
      districtName,
      districtWardId,
      departmentId,
      specialty,
    } = input;

    if (!name || !name.trim()) {
      return { success: false, error: "Vui lòng nhập Họ và tên." };
    }

    if (!email || !email.trim()) {
      return { success: false, error: "Vui lòng nhập Email." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: "Email không hợp lệ. Vui lòng nhập đúng định dạng email." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
    }

    if (!isIndependentTeacher && !schoolId && !newSchoolName) {
      return { success: false, error: "Vui lòng chọn hoặc nhập tên Trường học." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng trong hệ thống." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // If Independent Teacher -> Auto-create dedicated independent school & homeroom class
    if (isIndependentTeacher) {
      const newUser = await prisma.$transaction(async (tx) => {
        // Find default department & ward if available
        const defaultDept = await tx.educationDepartment.findFirst();
        const defaultWard = await tx.districtWard.findFirst();

        // Create independent virtual school space
        const indepSchool = await tx.school.create({
          data: {
            name: `Lớp học / Trung tâm Tự do - ${name.trim()}`,
            schoolType: "THPT",
            departmentId: defaultDept?.id || null,
            districtWardId: defaultWard?.id || null,
          },
        });

        // Create user with isApproved = true
        const user = await tx.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: "TEACHER",
            isApproved: true,
            schoolId: indepSchool.id,
            departmentId: defaultDept?.id || null,
            districtWardId: defaultWard?.id || null,
          },
        });

        // Create teacher profile
        const teacher = await tx.teacher.create({
          data: {
            userId: user.id,
            phone: phone ? phone.trim() : null,
            specialty: specialty ? specialty.trim() : "Toán học",
          },
        });

        // Auto-create default homeroom class for this independent teacher
        const defaultClass = await tx.classRoom.create({
          data: {
            name: `Lớp học Tự do 10A1`,
            gradeLevel: 10,
            schoolId: indepSchool.id,
            homeroomTeacherId: teacher.id,
          },
        });

        // Auto-create default 4 Groups (Tổ 1, Tổ 2, Tổ 3, Tổ 4)
        await tx.group.createMany({
          data: [
            { classId: defaultClass.id, name: "Tổ 1" },
            { classId: defaultClass.id, name: "Tổ 2" },
            { classId: defaultClass.id, name: "Tổ 3" },
            { classId: defaultClass.id, name: "Tổ 4" },
          ],
        });

        return user;
      });

      return {
        success: true,
        message: `Đăng ký tài khoản Giáo viên Tự do thành công! Bạn có thể đăng nhập ngay và tự thêm học sinh vào lớp học của mình.`,
      };
    }

    // Normal School Teacher Registration
    let finalSchoolId = schoolId;
    let finalDepartmentId = departmentId;
    let finalDistrictWardId = districtWardId;

    // Handle "Tạo trường mới" for Principal roles
    if (newSchoolName && (role === "ADMIN" || role === "VICE_PRINCIPAL")) {
      const cleanSchoolName = newSchoolName.trim();

      // Auto-create a virtual DistrictWard / Department if not perfectly matched from dataset
      // In production, you might search them using fuzzy matching here, but we default to using the literal names if standard doesn't exist
      const newSchool = await prisma.$transaction(async (tx) => {
        let deptId = departmentId;
        if (!deptId && provinceName) {
          const dept = await tx.educationDepartment.create({
            data: {
              name: `Sở GD&ĐT ${provinceName}`,
              code: `SO-${Date.now()}`,
            }
          });
          deptId = dept.id;
        }

        let wardId = districtWardId;
        if (!wardId && districtName && deptId) {
          const ward = await tx.districtWard.create({
            data: {
              name: `${districtName} - ${provinceName}`,
              departmentId: deptId,
              code: `PHONG-${Date.now()}`
            }
          });
          wardId = ward.id;
        }

        return tx.school.create({
          data: {
            name: cleanSchoolName,
            schoolType: "THPT",
            departmentId: deptId || null,
            districtWardId: wardId || null,
          }
        });
      });

      finalSchoolId = newSchool.id;
      finalDepartmentId = newSchool.departmentId || undefined;
      finalDistrictWardId = newSchool.districtWardId || undefined;
    } else if (!finalSchoolId) {
      return { success: false, error: "Vui lòng chọn Trường học." };
    }

    const targetSchool = await prisma.school.findUnique({
      where: { id: finalSchoolId! },
      select: { id: true, name: true, departmentId: true, districtWardId: true },
    });

    if (!targetSchool) {
      return { success: false, error: "Trường học được chọn không tồn tại." };
    }

    finalDepartmentId = finalDepartmentId || targetSchool.departmentId || undefined;
    finalDistrictWardId = finalDistrictWardId || targetSchool.districtWardId || undefined;

    // Create user and teacher record if TEACHER
    const newUser = await prisma.$transaction(async (tx) => {
      const isApprovedStatus = (role === "ADMIN"); // Principal is auto-activated for quick setup per User Instruction

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role,
          isApproved: isApprovedStatus,
          schoolId: targetSchool.id,
          departmentId: finalDepartmentId,
          districtWardId: finalDistrictWardId,
        },
      });

      if (role === "TEACHER") {
        await tx.teacher.create({
          data: {
            userId: user.id,
            phone: phone ? phone.trim() : null,
            specialty: specialty ? specialty.trim() : "Toán",
          },
        });
      }

      if (role === "ADMIN" || role === "VICE_PRINCIPAL") {
        await tx.userRoleScope.create({
          data: {
            userId: user.id,
            role: role as any,
            scopeType: "GLOBAL", // BGH & ADMIN có quyền toàn trường
          }
        });
      }

      return user;
    });

    const isPrincipalRole = role === "ADMIN" || role === "VICE_PRINCIPAL";
    const roleTitle = role === "ADMIN" ? "Hiệu trưởng" : role === "VICE_PRINCIPAL" ? "Phó Hiệu trưởng" : "Giáo viên";
    const approvalNotice = role === "ADMIN"
      ? `Đăng ký tài khoản Hiệu trưởng thành công! Không gian làm việc của trường đã được tạo. Bạn có thể đăng nhập ngay để thiết lập trường học.`
      : role === "VICE_PRINCIPAL"
      ? `Đăng ký tài khoản Phó Hiệu trưởng thành công! Tài khoản của bạn đang chờ Hiệu trưởng phê duyệt và cấp quyền quản lý.`
      : `Đăng ký tài khoản Giáo viên thành công! Tài khoản của bạn đang chờ Ban giám hiệu phê duyệt trước khi được cấp quyền truy cập dữ liệu.`;

    return {
      success: true,
      message: approvalNotice,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    };
  } catch (error: any) {
    console.error("Error in registerTeacher:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.",
    };
  }
}

export async function checkUserApprovalStatus(email: string) {
  try {
    if (!email || !email.trim()) return { isUnapproved: false };
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { isApproved: true, role: true },
    });
    if (user && user.isApproved === false) {
      return { isUnapproved: true };
    }
    return { isUnapproved: false };
  } catch {
    return { isUnapproved: false };
  }
}
