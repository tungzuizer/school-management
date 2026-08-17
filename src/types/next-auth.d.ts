import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      departmentId?: string;
      districtWardId?: string;
      schoolId?: string;
      campusId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    departmentId?: string;
    districtWardId?: string;
    schoolId?: string;
    campusId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    departmentId?: string;
    districtWardId?: string;
    schoolId?: string;
    campusId?: string;
  }
}
