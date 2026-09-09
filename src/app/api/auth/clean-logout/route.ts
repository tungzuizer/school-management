/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Client-side logout handler (`src/lib/client-auth.ts`).
 * 2. Uniqueness: API route that outputs Max-Age=0 Set-Cookie headers for all NextAuth session and CSRF cookies to prevent Vercel 494 REQUEST_HEADER_TOO_LARGE.
 * 3. Schema: `POST() => NextResponse<{ success: true }>`.
 * 4. Verbatim User Instruction: "khi tôi đăng xuất ra bị lỗi \"This Request has too large of headers. Your connection is working correctly. Vercel is working correctly. 494: REQUEST_HEADER_TOO_LARGE Code: REQUEST_HEADER_TOO_LARGE ID: hkg1::\"".
 */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

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

  for (let i = 0; i <= 10; i++) {
    cookieNames.push(`next-auth.session-token.${i}`);
    cookieNames.push(`__Secure-next-auth.session-token.${i}`);
  }

  const paths = ["/", "/api", "/api/auth"];

  for (const name of cookieNames) {
    for (const path of paths) {
      response.cookies.set({
        name,
        value: "",
        path,
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return response;
}
