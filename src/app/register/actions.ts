"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export interface RegisterTeacherInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "TEACHER" | "ADMIN" | "VICE_PRINCIPAL";
  schoolId: string;
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
    const { name, email, phone, password, role = "TEACHER", schoolId, districtWardId, departmentId, specialty } = input;

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

    if (!schoolId) {
      return { success: false, error: "Vui lòng chọn Trường học." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng trong hệ thống." };
    }

    // Find school details to inherit location attributes
    const targetSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, departmentId: true, districtWardId: true },
    });

    if (!targetSchool) {
      return { success: false, error: "Trường học được chọn không tồn tại." };
    }

    const finalDepartmentId = departmentId || targetSchool.departmentId || undefined;
    const finalDistrictWardId = districtWardId || targetSchool.districtWardId || undefined;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and teacher record if TEACHER
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role,
          isApproved: false,
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

      return user;
    });

    const isPrincipalRole = role === "ADMIN" || role === "VICE_PRINCIPAL";
    const roleTitle = role === "ADMIN" ? "Hiệu trưởng" : role === "VICE_PRINCIPAL" ? "Phó Hiệu trưởng" : "Giáo viên";
    const approvalNotice = isPrincipalRole
      ? `Đăng ký tài khoản ${roleTitle} thành công! Tài khoản của bạn đang chờ Sở GD&ĐT / Admin Hệ thống phê duyệt và cấp quyền quản lý.`
      : `Đăng ký tài khoản Giáo viên thành công! Tài khoản của bạn đang chờ Hiệu trưởng trường phê duyệt trước khi được cấp quyền truy cập dữ liệu.`;

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
