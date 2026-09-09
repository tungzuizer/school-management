/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Client-side logout handler (`src/lib/client-auth.ts`).
 * 2. Uniqueness: API route that outputs Max-Age=0 Set-Cookie headers for all NextAuth session and CSRF cookies to prevent Vercel 494 REQUEST_HEADER_TOO_LARGE.
 * 3. Schema: `POST() => NextResponse<{ success: true }>`.
 * 4. Verbatim User Instruction: "khi tôi đăng xuất ra bị lỗi \"This Request has too large of headers. Your connection is working correctly. Vercel is working correctly. 494: REQUEST_HEADER_TOO_LARGE Code: REQUEST_HEADER_TOO_LARGE ID: hkg1::\"".
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildCleanLogoutResponse() {
  const response = NextResponse.json({ success: true });

  // Only the exact NextAuth session & CSRF cookie keys on root path "/"
  const targetCookies = [
    "next-auth.session-token",
    "next-auth.session-token.0",
    "next-auth.session-token.1",
    "__Secure-next-auth.session-token",
    "__Secure-next-auth.session-token.0",
    "__Secure-next-auth.session-token.1",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];

  for (const name of targetCookies) {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export async function POST() {
  return buildCleanLogoutResponse();
}

export async function GET() {
  return buildCleanLogoutResponse();
}
