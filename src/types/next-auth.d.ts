import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      campusId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    campusId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    campusId?: string;
  }
}
