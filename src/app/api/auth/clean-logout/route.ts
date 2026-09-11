/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Client-side logout handler (`src/lib/client-auth.ts`) and direct browser navigation.
 * 2. Affected API: `POST` and `GET` in `src/app/api/auth/clean-logout/route.ts`.
 * 3. Schema: `POST(request: NextRequest) => NextResponse<{ success: true, redirect: string }>` and `GET(request: NextRequest) => NextResponse.redirect(...)`.
 * 4. Verbatim User Instruction: "khi đăng xuất vẫn lỗi This Request has too large of headers. Your connection is working correctly. Vercel is working correctly. 494: REQUEST_HEADER_TOO_LARGE Code: REQUEST_HEADER_TOO_LARGE ID: hkg1::".
 */

import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function buildCleanLogoutResponse(request?: NextRequest) {
  const isGet = request?.method === "GET";
  const callbackUrl =
    request?.nextUrl?.searchParams?.get("callbackUrl") || "/login?signout=success";

  const response = isGet
    ? NextResponse.redirect(new URL(callbackUrl, request?.url || "http://localhost:3000"))
    : NextResponse.json({ success: true, redirect: callbackUrl });

  // 1. Force modern browsers to immediately purge origin cookies and storage (HttpOnly included)
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // 2. Comprehensive cookie expiration for all possible NextAuth cookie keys and chunk indices (0..9)
  const baseCookieNames = [
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

  const targetCookies = [...baseCookieNames];
  // Include chunked session tokens 0 through 9
  for (let i = 0; i < 10; i++) {
    targetCookies.push(`next-auth.session-token.${i}`);
    targetCookies.push(`__Secure-next-auth.session-token.${i}`);
  }

  for (const name of targetCookies) {
    // Expire on root path
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

export async function POST(request: NextRequest) {
  return buildCleanLogoutResponse(request);
}

export async function GET(request: NextRequest) {
  return buildCleanLogoutResponse(request);
}
