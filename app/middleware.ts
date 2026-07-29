import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, getRateLimitResult } from "@/lib/security-headers";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rateLimit = getRateLimitResult(`global:${ip}`);

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ success: false, message: "Too many requests." }, { status: 429 });
    return applySecurityHeaders(response, request);
  }

  const isAdminRoute =
    (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) ||
    (pathname.startsWith("/manager") && !pathname.startsWith("/manager/login")) ||
    (pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/login"));
  const isAdminApiRoute = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login");

  if (isAdminRoute || isAdminApiRoute) {
    // Avoid importing admin-auth here (Edge runtime) — only check for cookie presence.
    const token = request.cookies.get("admin-session")?.value;
    if (!token) {
      if (isAdminRoute) {
        const redirectUrl = new URL(
          pathname.startsWith("/staff")
            ? "/staff/login"
            : pathname.startsWith("/manager")
            ? "/manager/login"
            : "/superadmin/login",
          request.url,
        );
        return NextResponse.redirect(redirectUrl);
      }

      const response = NextResponse.json({ success: false, message: "Admin session not found or expired." }, { status: 401 });
      return applySecurityHeaders(response, request);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
  response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
  response.headers.set("x-ratelimit-reset", String(rateLimit.resetAt));
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: ["/:path*"],
};
