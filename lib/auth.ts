import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/security";

export interface AuthUser {
  sub: string;
  email: string;
  role: string;
}

export function getTokenFromRequest(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return request.cookies.get("auth-token")?.value ?? "";
}

export function requireAuth(request: NextRequest, allowedRoles: string[] = []) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 }),
    };
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload !== "object") {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 401 }),
    };
  }

  const user = payload as AuthUser;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}
