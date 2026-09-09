/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router root route for admin (`/admin`), Breadcrumb (`src/components/ui/Breadcrumb.tsx:60`).
 * 2. Uniqueness: No existing file at `src/app/admin/page.tsx` exists (verified via Glob `src/app/admin/*.tsx`).
 * 3. Data Schemas: No data files read/written (server redirect).
 * 4. Verbatim User Instruction: "sao tôi bấm vô quản trị ở góc trên bên trái bị lỗi 404 This page could not be found."
 */

import { redirect } from "next/navigation";

export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
