import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { createJwt, getRateLimitResult, setSecureCookie, sanitizeObject, verifyCsrfToken } from "@/lib/security";
import { isValidEmail, isStrongPassword } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const name = typeof safeBody?.name === "string" ? safeBody.name.trim() : "";
    const phone = typeof safeBody?.phone === "string" ? safeBody.phone.trim() : "";
    const email = typeof safeBody?.email === "string" ? safeBody.email : "";
    const password = typeof safeBody?.password === "string" ? safeBody.password : "";
    const csrfToken = typeof safeBody?.csrfToken === "string" ? safeBody.csrfToken : "";
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`register:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    if (!verifyCsrfToken(csrfToken)) {
      return NextResponse.json({ success: false, message: "Invalid CSRF token." }, { status: 403 });
    }

    if (!name || !email || !password) {
      auditLog("register-failed", "Missing registration details", email || "unknown", clientIp);
      return NextResponse.json({ success: false, message: "Nama, email, dan password wajib diisi." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      auditLog("register-failed", "Invalid email format", email, clientIp);
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      auditLog("register-failed", "Weak password", email, clientIp);
      return NextResponse.json({ success: false, message: "Password must contain uppercase, number, and symbol." }, { status: 400 });
    }

    const token = createJwt({ sub: email, email, role: "customer", name, phone });
    const response = NextResponse.json({
      success: true,
      message: "Registration successful.",
      user: {
        id: email,
        name,
        email,
        phone,
        role: "customer",
      },
      token,
    });

    setSecureCookie(response, "auth-token", token, { maxAge: 60 * 60 * 8 });
    auditLog("register-success", "User registered successfully", email, clientIp);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to process registration request." }, { status: 500 });
  }
}
