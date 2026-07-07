import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { createJwt, getRateLimitResult, setSecureCookie, sanitizeObject, verifyCsrfToken } from "@/lib/security";
import { isValidEmail, isStrongPassword } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const email = typeof safeBody?.email === "string" ? safeBody.email : "";
    const password = typeof safeBody?.password === "string" ? safeBody.password : "";
    const csrfToken = typeof safeBody?.csrfToken === "string" ? safeBody.csrfToken : "";
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`login:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    if (!verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ success: false, message: "Invalid CSRF token." }, { status: 403 });
    }

    if (!email || !password) {
      auditLog("login-failed", "Missing login credentials", email || "unknown", clientIp);
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      auditLog("login-failed", "Invalid email format", email, clientIp);
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      auditLog("login-failed", "Weak password", email, clientIp);
      return NextResponse.json({ success: false, message: "Password must contain uppercase, number, and symbol." }, { status: 400 });
    }

    const token = createJwt({ sub: "demo-user", email, role: "customer" });
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: "demo-user",
        email,
        role: "customer",
      },
      token,
    });

    setSecureCookie(response, "auth-token", token, { maxAge: 60 * 60 * 8 });
    auditLog("login-success", "User authenticated successfully", email, clientIp);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to process login request." }, { status: 500 });
  }
}
