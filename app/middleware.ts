import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders, getRateLimitResult } from "@/lib/security-headers";

function decodeJwtPayload(token: string) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = payload.length % 4;
    const normalized = padding ? payload + "=".repeat(4 - padding) : payload;
    const decoded = globalThis.atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getProtectedPanelRole(pathname: string) {
  if (pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/login")) return "super_admin";
  if (pathname.startsWith("/manager") && !pathname.startsWith("/manager/login")) return "manager";
  if (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) return "staff";
  return null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  console.log("[middleware]", { pathname, hasToken: Boolean(request.cookies.get("admin-session")?.value) });
  const rateLimit = getRateLimitResult(`global:${ip}`);

  if (!rateLimit.allowed) {
    const response = NextResponse.json({ success: false, message: "Too many requests." }, { status: 429 });
    return applySecurityHeaders(response, request);
  }

  const isProtectedPanelRoute =
    (pathname.startsWith("/staff") && !pathname.startsWith("/staff/login")) ||
    (pathname.startsWith("/manager") && !pathname.startsWith("/manager/login")) ||
    (pathname.startsWith("/superadmin") && !pathname.startsWith("/superadmin/login"));
  const isAdminApiRoute = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login");

  if (isProtectedPanelRoute || isAdminApiRoute) {
    const token = request.cookies.get("admin-session")?.value;
    if (!token) {
      if (isProtectedPanelRoute) {
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

    const payload = decodeJwtPayload(token);
    const currentRole = typeof payload?.role === "string" ? payload.role : null;
    if (isProtectedPanelRoute) {
      const expectedRole = getProtectedPanelRole(pathname);
      if (currentRole && expectedRole && currentRole !== expectedRole) {
        const redirectUrl = new URL(
          currentRole === "super_admin"
            ? "/superadmin/login"
            : currentRole === "manager"
            ? "/manager/login"
            : "/staff/login",
          request.url,
        );
        return NextResponse.redirect(redirectUrl);
      }
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
