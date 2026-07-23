import { NextResponse, type NextRequest } from "next/server";
import { sanitizeObject, applySecurityHeaders } from "@/lib/security";
import { authenticateAdmin, writeAdminSessionCookie } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const body = sanitizeObject(await request.json().catch(() => ({})) as Record<string, unknown>);
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Admin email and password are required." }, { status: 400 });
    }

    const authResult = await authenticateAdmin(email, password);
    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
      user: authResult.user,
    });

    return applySecurityHeaders(writeAdminSessionCookie(response, authResult.token));
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 401 });
  }
}
