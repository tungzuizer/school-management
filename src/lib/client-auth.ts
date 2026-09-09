/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js Layouts & Components (`src/components/layout/Header.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/student/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/admin/layout.tsx`, `src/app/department/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/student/profile/page.tsx`, `src/app/teacher/profile/page.tsx`, `src/components/auth/ForcePasswordChangeModal.tsx`).
 * 2. Uniqueness: Dedicated client-side cookie and session purger preventing Vercel 494 REQUEST_HEADER_TOO_LARGE error during logout.
 * 3. Schema: `handleClientSignOut(callbackUrl?: string): Promise<void>`.
 * 4. Verbatim User Instruction: "khi tôi đăng xuất ra bị lỗi \"This Request has too large of headers. Your connection is working correctly. Vercel is working correctly. 494: REQUEST_HEADER_TOO_LARGE Code: REQUEST_HEADER_TOO_LARGE ID: hkg1::\"".
 */

"use client";

import { signOut } from "next-auth/react";

/**
 * Universal safe logout that purges all cookies and tokens on the client
 * to prevent Vercel 494 REQUEST_HEADER_TOO_LARGE errors.
 */
export async function handleClientSignOut(callbackUrl = "/login") {
  // 1. Clear all accessible cookies in document.cookie
  if (typeof document !== "undefined") {
    try {
      const cookieNames = [
        "next-auth.session-token",
        "next-auth.csrf-token",
        "next-auth.callback-url",
        "next-auth.state",
        "next-auth.pkce.code_verifier",
        "__Secure-next-auth.session-token",
        "__Secure-next-auth.csrf-token",
        "__Secure-next-auth.callback-url",
        "__Host-next-auth.csrf-token",
      ];

      // Add chunked cookie names (.0 to .10)
      for (let i = 0; i <= 10; i++) {
        cookieNames.push(`next-auth.session-token.${i}`);
        cookieNames.push(`__Secure-next-auth.session-token.${i}`);
      }

      // Read current cookies from document
      const currentCookies = document.cookie.split(";");
      for (const cookie of currentCookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name) cookieNames.push(name);
      }

      const paths = [
        "/",
        "/api",
        "/api/auth",
        "/student",
        "/teacher",
        "/admin",
        "/ward",
        "/department",
        "/vice-principal",
      ];

      const hostname = window.location.hostname;
      const domains = [hostname, `.${hostname}`, ""];

      for (const name of new Set(cookieNames)) {
        for (const path of paths) {
          for (const domain of domains) {
            const domainPart = domain ? `domain=${domain};` : "";
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};${domainPart}`;
            document.cookie = `${name}=;Max-Age=0;path=${path};${domainPart}`;
          }
        }
      }
    } catch (e) {
      console.warn("Error clearing browser cookies:", e);
    }
  }

  // 2. Clear localStorage and sessionStorage
  try {
    if (typeof localStorage !== "undefined") localStorage.clear();
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  } catch {
    // Ignore storage exceptions
  }

  // 3. Call server-side clean-logout route to wipe HttpOnly cookies
  try {
    await fetch("/api/auth/clean-logout", { credentials: "same-origin", method: "POST" });
  } catch {
    // Ignore fetch error
  }

  // 4. Trigger NextAuth signOut with redirect: false so it doesn't crash on 494
  try {
    await signOut({ redirect: false, callbackUrl });
  } catch (err) {
    console.warn("NextAuth signOut exception:", err);
  }

  // 5. Clean hard redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = callbackUrl;
  }
}
