import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, getRateLimitResult } from "@/lib/security";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rateLimit = getRateLimitResult(`global:${ip}`);

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ success: false, message: "Too many requests." }, { status: 429 });
    return applySecurityHeaders(response, request);
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("admin-session")?.value;
    if (!adminSession) {
      const redirectUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-ratelimit-limit", String(rateLimit.limit));
  response.headers.set("x-ratelimit-remaining", String(rateLimit.remaining));
  response.headers.set("x-ratelimit-reset", String(rateLimit.resetAt));
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};
