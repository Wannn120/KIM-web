import { NextResponse, type NextRequest } from "next/server";
import { sanitizeObject, applySecurityHeaders, getRateLimitResult } from "@/lib/security-headers";
import { authenticateAdmin, writeAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateLimit = getRateLimitResult(`login:${ip}`, 10, 300000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const body = sanitizeObject(await request.json().catch(() => ({})) as Record<string, unknown>);
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Admin email and password are required." }, { status: 400 });
    }

    const authResult = await authenticateAdmin(email, password);
    const response = writeAdminSessionCookie(
      NextResponse.json({
        success: true,
        message: "Admin login successful.",
        user: authResult.user,
      }),
      authResult.token,
    );

    return applySecurityHeaders(response);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid credentials." }, { status: 401 });
  }
}
