import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role) {
    const role = session.user.role;
    if (role === "SUPER_ADMIN") {
      redirect("/admin/dashboard");
    } else if (role === "DEPARTMENT_ADMIN") {
      redirect("/department/dashboard");
    } else if (role === "DISTRICT_ADMIN") {
      redirect("/district/dashboard");
    } else if (role === "WARD_ADMIN") {
      redirect("/ward/dashboard");
    } else if (role === "ADMIN") {
      redirect("/admin/dashboard");
    } else if (role === "VICE_PRINCIPAL") {
      redirect("/vice-principal/dashboard");
    } else if (role === "SUBJECT_HEAD") {
      redirect("/subject-head/dashboard");
    } else if (role === "TEACHER") {
      redirect("/teacher/dashboard");
    } else if (role === "STUDENT") {
      redirect("/student/dashboard");
    }
  }

  redirect("/login");
}
