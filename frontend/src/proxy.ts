import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ─── JWT verification at the network boundary ────────────────────────────────
// Renamed from `middleware` in Next 16, where that convention is deprecated.
// `proxy` always runs on the nodejs runtime and that is not configurable — the
// edge runtime is not supported here, which is fine as jose runs on both.
// NOTE: JWT_SECRET (no NEXT_PUBLIC_ prefix) is only available server-side.
// Never expose it to the client bundle.
const JWT_SECRET_VALUE = process.env.JWT_SECRET || "";

async function verifyToken(token: string): Promise<{ role: string } | null> {
  if (!JWT_SECRET_VALUE) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_VALUE);
    const { payload } = await jwtVerify(token, secret);
    return { role: typeof payload.role === "string" ? payload.role : "" };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const isAccessingAdmin     = request.nextUrl.pathname.startsWith("/admin");
  const isAccessingDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAccessingAuthPages =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // ── 1. Protect Admin routes ─────────────────────────────────────────────────
  if (isAccessingAdmin) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cryptographically verify the JWT and extract role — never trust a cookie
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 2. Protect Dashboard route ──────────────────────────────────────────────
  if (isAccessingDashboard) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 3. Redirect already-authenticated users away from /login & /register ────
  if (isAccessingAuthPages && token) {
    const payload = await verifyToken(token);
    if (payload) {
      const destination = payload.role === "ADMIN" ? "/admin/products" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    // Token present but invalid — allow through to login/register
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/register"],
};
