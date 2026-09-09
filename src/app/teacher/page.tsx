/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router root route for teacher (`/teacher`), Breadcrumb (`src/components/ui/Breadcrumb.tsx:60`), Proxy (`src/proxy.ts:57`).
 * 2. Uniqueness: No existing file at `src/app/teacher/page.tsx` exists (verified via Glob `src/app/teacher/*.tsx`).
 * 3. Data Schemas: No data files read/written (server redirect).
 * 4. Verbatim User Instruction: "sao tôi bấm vô quản trị ở góc trên bên trái bị lỗi 404 This page could not be found."
 */

import { redirect } from "next/navigation";

export default function TeacherRootPage() {
  redirect("/teacher/dashboard");
}
