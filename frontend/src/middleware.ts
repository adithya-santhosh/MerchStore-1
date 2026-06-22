import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("role")?.value;

  const isAccessingAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isAccessingAuthPages = request.nextUrl.pathname.startsWith("/login") || 
                               request.nextUrl.pathname.startsWith("/register");

  // 1. Guard Admin Routes
  if (isAccessingAdmin) {
    if (!token || role !== "admin") {
      const loginUrl = new URL("/login", request.url);
      // Pass the original destination so we can redirect back after login
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect authenticated users away from /login & /register
  if (isAccessingAuthPages && token) {
    const destination = role === "admin" ? "/admin/products" : "/";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register"]
};
