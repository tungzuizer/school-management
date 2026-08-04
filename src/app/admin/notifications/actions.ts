"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getNotifications() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sender: { select: { name: true, role: true } },
      receiver: { select: { name: true, role: true } },
    },
  });
  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    senderName: n.sender.name,
    senderRole: n.sender.role,
    receiverName: n.receiver?.name ?? "N/A",
    receiverRole: n.receiver?.role ?? "STUDENT",
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function getReceiverOptions() {
  // Get all users grouped by role
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  // Get all classes for "send to entire class" option
  const classes = await prisma.classRoom.findMany({
    select: {
      id: true,
      name: true,
      students: { select: { userId: true } },
    },
    orderBy: { name: "asc" },
  });

  return { users, classes };
}

export async function sendNotification(data: {
  title: string;
  content: string;
  receiverIds: string[];
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Chưa đăng nhập" };
  }

  if (!data.title.trim() || !data.content.trim()) {
    return { error: "Tiêu đề và nội dung không được trống" };
  }

  if (data.receiverIds.length === 0) {
    return { error: "Chưa chọn người nhận" };
  }

  // Create notifications for each receiver
  await prisma.notification.createMany({
    data: data.receiverIds.map((receiverId) => ({
      senderId: session.user.id,
      receiverId,
      title: data.title.trim(),
      content: data.content.trim(),
    })),
  });

  return { success: true, count: data.receiverIds.length };
}

export async function sendNotificationToRole(data: {
  title: string;
  content: string;
  targetRole: "TEACHER" | "STUDENT" | "ALL";
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Chưa đăng nhập" };
  }

  const where =
    data.targetRole === "ALL"
      ? { id: { not: session.user.id } }
      : { role: data.targetRole };

  const receivers = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  if (receivers.length === 0) {
    return { error: "Không tìm thấy người nhận" };
  }

  await prisma.notification.createMany({
    data: receivers.map((r) => ({
      senderId: session.user.id,
      receiverId: r.id,
      title: data.title.trim(),
      content: data.content.trim(),
    })),
  });

  return { success: true, count: receivers.length };
}

export async function deleteNotification(id: string) {
  await prisma.notification.delete({ where: { id } });
  return { success: true };
}
