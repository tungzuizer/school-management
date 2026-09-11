/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js Layouts & Components (`src/components/layout/Header.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/student/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/admin/layout.tsx`, `src/app/department/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/student/profile/page.tsx`, `src/app/teacher/profile/page.tsx`, `src/components/auth/ForcePasswordChangeModal.tsx`).
 * 2. Affected API: `handleClientSignOut(callbackUrl?: string): Promise<void>` in `src/lib/client-auth.ts`.
 * 3. Schema: `handleClientSignOut(callbackUrl?: string): Promise<void>`.
 * 4. Verbatim User Instruction: "khi đăng xuất vẫn lỗi This Request has too large of headers. Your connection is working correctly. Vercel is working correctly. 494: REQUEST_HEADER_TOO_LARGE Code: REQUEST_HEADER_TOO_LARGE ID: hkg1::".
 */

"use client";

import { signOut } from "next-auth/react";

/**
 * Universal safe logout that purges all cookies and tokens on the client
 * and navigates cleanly to the login screen with signout flag.
 */
export async function handleClientSignOut(callbackUrl = "/login") {
  const finalUrl = callbackUrl.includes("?")
    ? `${callbackUrl}&signout=success`
    : `${callbackUrl}?signout=success`;

  // 1. Clear all client-accessible cookies in document.cookie across all subpaths and domain variations
  if (typeof document !== "undefined") {
    try {
      const cookieNames = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Host-next-auth.csrf-token",
        "__Secure-next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.callback-url",
        "next-auth.pkce.code_verifier",
        "__Secure-next-auth.pkce.code_verifier",
        "next-auth.state",
        "__Secure-next-auth.state",
      ];

      // Add chunked cookie names 0..9
      for (let i = 0; i < 10; i++) {
        cookieNames.push(`next-auth.session-token.${i}`);
        cookieNames.push(`__Secure-next-auth.session-token.${i}`);
      }

      // Read all active cookies from document.cookie
      const currentCookies = document.cookie.split(";");
      for (const cookie of currentCookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (name) cookieNames.push(name);
      }

      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const domains = [hostname, `.${hostname}`, ""];
      const paths = [
        "/",
        "/api",
        "/api/auth",
        "/admin",
        "/teacher",
        "/student",
        "/ward",
        "/department",
        "/vice-principal",
        "/login",
      ];

      for (const name of new Set(cookieNames)) {
        for (const domain of domains) {
          const domainPart = domain ? `domain=${domain};` : "";
          for (const path of paths) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};${domainPart}`;
            document.cookie = `${name}=;Max-Age=0;path=${path};${domainPart}`;
          }
        }
      }
    } catch (e) {
      console.warn("Error clearing browser cookies:", e);
    }
  }

  // 2. Clear via modern CookieStore API if available
  if (typeof window !== "undefined" && "cookieStore" in window) {
    try {
      const cookieStore = (window as unknown as { cookieStore?: { getAll: () => Promise<Array<{ name: string; domain?: string; path?: string }>>; delete: (options: { name: string; domain?: string; path?: string }) => Promise<void> } }).cookieStore;
      if (cookieStore && typeof cookieStore.getAll === "function") {
        const allCookies = await cookieStore.getAll();
        for (const c of allCookies) {
          try {
            await cookieStore.delete({ name: c.name, domain: c.domain, path: c.path || "/" });
            await cookieStore.delete({ name: c.name, path: "/" });
          } catch {
            // Ignore individual delete failures
          }
        }
      }
    } catch {
      // Ignore cookieStore error
    }
  }

  // 3. Clear localStorage and sessionStorage
  try {
    if (typeof localStorage !== "undefined") localStorage.clear();
    if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  } catch {
    // Ignore storage exceptions
  }

  // 4. Call server-side clean-logout route to wipe HttpOnly cookies with Clear-Site-Data
  try {
    await fetch("/api/auth/clean-logout", {
      credentials: "same-origin",
      method: "POST",
      cache: "no-store",
    });
  } catch {
    // Ignore fetch error
  }

  // 5. Trigger NextAuth signOut with redirect: false
  try {
    await signOut({ redirect: false });
  } catch (err) {
    console.warn("NextAuth signOut exception:", err);
  }

  // 6. Hard navigation to clean-logout endpoint which sends Clear-Site-Data on top-level GET and redirects to login
  if (typeof window !== "undefined") {
    const cleanLogoutUrl = `/api/auth/clean-logout?callbackUrl=${encodeURIComponent(finalUrl)}`;
    window.location.replace(cleanLogoutUrl);
  }
}
