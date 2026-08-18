"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export type WorkflowFilter = {
  status?: string;
  moduleName?: string;
  campusId?: string;
  search?: string;
};

// Seed mock approval workflows if none exist
async function ensureSeedWorkflows() {
  try {
    const db = prisma as any;
    const count = await db.approvalWorkflow.count();
    if (count > 0) return;

    const mockData = [
      {
        moduleName: "QUALITY_OBJECTIVE",
        recordId: "obj-001",
        title: "Tỷ lệ học sinh đạt học lực Giỏi và Khá toàn trường",
        campusId: "campus-main",
        currentStep: 2,
        currentStatus: "SUBMITTED",
        submittedBy: "usr-teacher1",
        submittedByName: "Nguyễn Văn Phú (Phụ trách ĐBCL)",
        submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        isLocked: false,
        version: 1,
        comments: {
          create: [
            {
              userName: "Nguyễn Văn Phú",
              userRole: "Phụ trách ĐBCL",
              commentType: "SUBMIT",
              commentContent: "Kính gửi Ban BGH phê duyệt Mục tiêu Chất lượng Học lực năm học 2026-2027.",
            },
          ],
        },
      },
      {
        moduleName: "STRATEGY_KPI",
        recordId: "kpi-period-01",
        title: "Bộ chỉ số KPI Chuyển đổi số & Học tập HK1 năm 2026",
        campusId: "campus-1",
        currentStep: 3,
        currentStatus: "CAMPUS_CONFIRMED",
        submittedBy: "usr-vp1",
        submittedByName: "Trần Thị Minh (Phó Hiệu Trưởng PH1)",
        submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        reviewedBy: "usr-vp1",
        reviewedByName: "Trần Thị Minh",
        reviewedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        isLocked: false,
        version: 1,
        comments: {
          create: [
            {
              userName: "Lê Văn Hùng",
              userRole: "Cán bộ Phân hiệu 1",
              commentType: "SUBMIT",
              commentContent: "Đã tổng hợp đầy đủ các chỉ số KPI Phân hiệu 1.",
            },
            {
              userName: "Trần Thị Minh",
              userRole: "Phó Hiệu trưởng Phân hiệu 1",
              commentType: "APPROVE",
              commentContent: "Đã xác nhận dữ liệu KPI Phân hiệu 1 chuẩn xác. Kính trình Hiệu trưởng phê duyệt.",
            },
          ],
        },
      },
      {
        moduleName: "QUALITY_OBJECTIVE",
        recordId: "obj-002",
        title: "Chỉ số an toàn & Phòng chống bạo lực học đường năm 2026",
        campusId: "campus-main",
        currentStep: 6,
        currentStatus: "LOCKED",
        submittedBy: "usr-admin",
        submittedByName: "Hoàng Minh Tuấn (Phòng Giám sát)",
        submittedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        approvedBy: "usr-principal",
        approvedByName: "Phạm Hoàng Anh (Hiệu trưởng)",
        approvedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        isLocked: true,
        lockedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        version: 1,
        comments: {
          create: [
            {
              userName: "Phạm Hoàng Anh",
              userRole: "Hiệu trưởng",
              commentType: "APPROVE",
              commentContent: "Đồng ý phê duyệt và thực hiện ban hành áp dụng toàn hệ thống. Đã khóa dữ liệu chính thức.",
            },
          ],
        },
      },
      {
        moduleName: "MONTHLY_PLAN",
        recordId: "plan-month-09",
        title: "Kế hoạch giáo dục trọng tâm Tháng 9/2026",
        campusId: "campus-2",
        currentStep: 4,
        currentStatus: "VP_REVIEWED",
        submittedBy: "usr-[#2]",
        submittedByName: "Lê Thu Hà (Tổ trưởng Chuyên môn)",
        submittedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        reviewedBy: "usr-[#vp2]",
        reviewedByName: "Đỗ Đức Kiên (Phó Hiệu Trưởng Chuyên môn)",
        reviewedAt: new Date(Date.now() - 12 * 3600 * 1000),
        dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000),
        isLocked: false,
        version: 1,
        comments: {
          create: [
            {
              userName: "Đỗ Đức Kiên",
              userRole: "Phó Hiệu Trưởng",
              commentType: "APPROVE",
              commentContent: "Đã rà soát chi tiết nội dung môn học và phân công giảng dạy. Trình Hiệu trưởng phê duyệt cuối cùng.",
            },
          ],
        },
      },
      {
        moduleName: "QUALITY_OBJECTIVE",
        recordId: "obj-003",
        title: "Tỷ lệ giáo viên áp dụng công nghệ AI vào bài giảng",
        campusId: "campus-main",
        currentStep: 2,
        currentStatus: "EDIT_REQUESTED",
        submittedBy: "usr-t3",
        submittedByName: "Ngô Thanh Sơn (Trung tâm CNTT)",
        submittedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
        rejectionReason: "Cần làm rõ phương pháp đánh giá thực tế và công cụ kiểm chứng đính kèm.",
        isLocked: false,
        version: 1,
        comments: {
          create: [
            {
              userName: "Trần Thị Minh",
              userRole: "Phó Hiệu trưởng",
              commentType: "REQUEST_EDIT",
              commentContent: "Đề nghị bổ sung phụ lục công cụ AI được chấp nhận trước khi BGH duyệt.",
            },
          ],
        },
      },
    ];

    for (const item of mockData) {
      await db.approvalWorkflow.create({ data: item });
    }
  } catch (err) {
    console.error("Error seeding approval workflows:", err);
  }
}

export async function getApprovalWorkflows(filters?: WorkflowFilter) {
  try {
    const db = prisma as any;
    if (!db.approvalWorkflow) {
      return { success: true, data: [] };
    }
    await ensureSeedWorkflows();

    const where: any = {};

    if (filters?.status && filters.status !== "ALL") {
      if (filters.status === "PENDING") {
        where.currentStatus = { in: ["SUBMITTED", "CAMPUS_CONFIRMED", "VP_REVIEWED", "UNLOCK_REQUESTED"] };
      } else {
        where.currentStatus = filters.status;
      }
    }

    if (filters?.moduleName && filters.moduleName !== "ALL") {
      where.moduleName = filters.moduleName;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { submittedByName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const workflows = await db.approvalWorkflow.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: workflows };
  } catch (error: any) {
    console.error("getApprovalWorkflows error:", error);
    return { success: false, error: error.message || "Failed to fetch workflows" };
  }
}

export async function getWorkflowDetails(id: string) {
  try {
    const db = prisma as any;
    if (!db.approvalWorkflow) {
      return { success: false, error: "Cơ sở dữ liệu chưa sẵn sàng" };
    }
    const workflow = await db.approvalWorkflow.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workflow) {
      return { success: false, error: "Không tìm thấy hồ sơ phê duyệt" };
    }

    return { success: true, data: workflow };
  } catch (error: any) {
    console.error("getWorkflowDetails error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitForApproval(data: {
  recordId: string;
  moduleName: string;
  title: string;
  campusId?: string;
  comment?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Người dùng";
    const db = prisma as any;

    // Check if workflow exists for recordId
    let workflow = await db.approvalWorkflow.findFirst({
      where: { recordId: data.recordId, moduleName: data.moduleName },
    });

    if (workflow) {
      if (workflow.isLocked) {
        return { success: false, error: "Hồ sơ đã bị khóa dữ liệu, không thể gửi lại trừ khi được mở khóa." };
      }
      workflow = await db.approvalWorkflow.update({
        where: { id: workflow.id },
        data: {
          currentStep: 2,
          currentStatus: "SUBMITTED",
          submittedBy: session?.user?.id || "user-id",
          submittedByName: userName,
          submittedAt: new Date(),
          rejectionReason: null,
        },
      });
    } else {
      workflow = await db.approvalWorkflow.create({
        data: {
          moduleName: data.moduleName,
          recordId: data.recordId,
          title: data.title,
          campusId: data.campusId || null,
          currentStep: 2,
          currentStatus: "SUBMITTED",
          submittedBy: session?.user?.id || "user-id",
          submittedByName: userName,
          submittedAt: new Date(),
        },
      });
    }

    if (data.comment) {
      await db.approvalComment.create({
        data: {
          workflowId: workflow.id,
          userId: session?.user?.id || "user-id",
          userName,
          userRole: (session?.user as any)?.role || "Cán bộ gửi",
          commentType: "SUBMIT",
          commentContent: data.comment,
        },
      });
    }

    
    return { success: true, message: "Đã trình gửi hồ sơ phê duyệt thành công!", data: workflow };
  } catch (error: any) {
    console.error("submitForApproval error:", error);
    return { success: false, error: error.message };
  }
}

export async function confirmCampusStep(workflowId: string, comment?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ Phân hiệu";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: 3,
        currentStatus: "CAMPUS_CONFIRMED",
        reviewedBy: session?.user?.id || "user-id",
        reviewedByName: userName,
        reviewedAt: new Date(),
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: "Phụ trách Phân hiệu",
        commentType: "CONFIRM_CAMPUS",
        commentContent: comment || "Đã xác nhận hồ sơ cấp Phân hiệu.",
      },
    });

    
    return { success: true, message: "Phân hiệu đã xác nhận hồ sơ thành công!", data: workflow };
  } catch (error: any) {
    console.error("confirmCampusStep error:", error);
    return { success: false, error: error.message };
  }
}

export async function reviewVicePrincipalStep(workflowId: string, comment?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Phó Hiệu trưởng";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: 4,
        currentStatus: "VP_REVIEWED",
        reviewedBy: session?.user?.id || "user-id",
        reviewedByName: userName,
        reviewedAt: new Date(),
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: "Phó Hiệu trưởng",
        commentType: "VP_REVIEW",
        commentContent: comment || "Đã rà soát hồ sơ. Trình Hiệu trưởng phê duyệt.",
      },
    });

    
    return { success: true, message: "Phó Hiệu trưởng đã thẩm định hồ sơ!", data: workflow };
  } catch (error: any) {
    console.error("reviewVicePrincipalStep error:", error);
    return { success: false, error: error.message };
  }
}

export async function approvePrincipalStep(workflowId: string, comment?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Hiệu trưởng";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: 6,
        currentStatus: "LOCKED",
        approvedBy: session?.user?.id || "user-id",
        approvedByName: userName,
        approvedAt: new Date(),
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: "Hiệu trưởng",
        commentType: "APPROVE",
        commentContent: comment || "Hiệu trưởng đã phê duyệt chính thức. Hồ sơ được khóa dữ liệu.",
      },
    });

    
    return { success: true, message: "Hiệu trưởng đã phê duyệt & Khóa dữ liệu thành công!", data: workflow };
  } catch (error: any) {
    console.error("approvePrincipalStep error:", error);
    return { success: false, error: error.message };
  }
}

export async function requestEditWorkflow(workflowId: string, reason: string) {
  try {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Vui lòng nhập lý do chi tiết khi yêu cầu chỉnh sửa!" };
    }

    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Người thẩm định";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStatus: "EDIT_REQUESTED",
        rejectionReason: reason,
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: (session?.user as any)?.role || "Ban Giám hiệu",
        commentType: "REQUEST_EDIT",
        commentContent: `[YÊU CẦU SỬA ĐỔI]: ${reason}`,
      },
    });

    
    return { success: true, message: "Đã chuyển yêu cầu bổ sung/chỉnh sửa đến người lập!", data: workflow };
  } catch (error: any) {
    console.error("requestEditWorkflow error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectWorkflow(workflowId: string, reason: string) {
  try {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Vui lòng nhập lý do trả lại / từ chối!" };
    }

    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Ban Giám hiệu";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStatus: "REJECTED",
        rejectionReason: reason,
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: (session?.user as any)?.role || "Ban Giám hiệu",
        commentType: "REJECT",
        commentContent: `[TỪ CHỐI / TRẢ LẠI]: ${reason}`,
      },
    });

    
    return { success: true, message: "Đã từ chối / trả lại hồ sơ!", data: workflow };
  } catch (error: any) {
    console.error("rejectWorkflow error:", error);
    return { success: false, error: error.message };
  }
}

export async function recallWorkflow(workflowId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Người lập";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.findUnique({ where: { id: workflowId } });
    if (workflow?.isLocked || workflow?.currentStatus === "LOCKED") {
      return { success: false, error: "Hồ sơ đã được phê duyệt & khóa, không thể rút lại!" };
    }

    const updated = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: 1,
        currentStatus: "DRAFT",
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: "Người lập",
        commentType: "RECALL",
        commentContent: "Đã rút lại hồ sơ trình duyệt để cập nhật thêm thông tin.",
      },
    });

    
    return { success: true, message: "Đã rút lại hồ sơ thành công!", data: updated };
  } catch (error: any) {
    console.error("recallWorkflow error:", error);
    return { success: false, error: error.message };
  }
}

export async function requestUnlockWorkflow(workflowId: string, reason: string) {
  try {
    if (!reason || !reason.trim()) {
      return { success: false, error: "Vui lòng nhập lý do mở khóa dữ liệu!" };
    }

    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Người yêu cầu";
    const db = prisma as any;

    const workflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStatus: "UNLOCK_REQUESTED",
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: (session?.user as any)?.role || "Cán bộ quản lý",
        commentType: "UNLOCK_REQUEST",
        commentContent: `[YÊU CẦU MỞ KHÓA]: ${reason}`,
      },
    });

    
    return { success: true, message: "Đã trình gửi yêu cầu mở khóa dữ liệu tới Hiệu trưởng!", data: workflow };
  } catch (error: any) {
    console.error("requestUnlockWorkflow error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveUnlockWorkflow(workflowId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Hiệu trưởng";
    const db = prisma as any;

    const current = await db.approvalWorkflow.findUnique({ where: { id: workflowId } });
    const newVersion = (current?.version || 1) + 1;

    const updated = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        currentStep: 1,
        currentStatus: "DRAFT",
        isLocked: false,
        lockedAt: null,
        version: newVersion,
      },
    });

    await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: "Hiệu trưởng",
        commentType: "APPROVE_UNLOCK",
        commentContent: `Hiệu trưởng đã phê duyệt mở khóa dữ liệu. Tạo phiên bản làm việc v${newVersion}.0`,
      },
    });

    
    return { success: true, message: `Đã mở khóa dữ liệu thành công! Phiên bản mới: v${newVersion}.0`, data: updated };
  } catch (error: any) {
    console.error("approveUnlockWorkflow error:", error);
    return { success: false, error: error.message };
  }
}

export async function addWorkflowComment(workflowId: string, commentContent: string, attachmentUrl?: string) {
  try {
    if (!commentContent || !commentContent.trim()) {
      return { success: false, error: "Nội dung ý kiến không được để trống" };
    }

    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ";
    const db = prisma as any;

    const comment = await db.approvalComment.create({
      data: {
        workflowId,
        userId: session?.user?.id || "user-id",
        userName,
        userRole: (session?.user as any)?.role || "Thành viên",
        commentType: "COMMENT",
        commentContent,
        attachmentUrl: attachmentUrl || null,
      },
    });

    
    return { success: true, data: comment };
  } catch (error: any) {
    console.error("addWorkflowComment error:", error);
    return { success: false, error: error.message };
  }
}
