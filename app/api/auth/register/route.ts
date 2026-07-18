import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { createJwt, getRateLimitResult, setSecureCookie, sanitizeObject, verifyCsrfToken } from "@/lib/security";
import { isValidEmail, isStrongPassword } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const username = typeof safeBody?.username === "string" ? safeBody.username.trim() : "";
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

    if (!username || !name || !email || !password) {
      auditLog("register-failed", "Missing registration details", email || "unknown", clientIp);
      return NextResponse.json({ success: false, message: "Username, nama, email, dan password wajib diisi." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      auditLog("register-failed", "Invalid email format", email, clientIp);
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      auditLog("register-failed", "Weak password", email, clientIp);
      return NextResponse.json({ success: false, message: "Password must contain uppercase, number, and symbol." }, { status: 400 });
    }

    // Hash password and create user in the database
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          username,
          name,
          email,
          phone,
          passwordHash,
        },
      });

      const token = createJwt({ sub: user.id, email: user.email, role: "customer", name: user.name, phone: user.phone });
      const response = NextResponse.json({
        success: true,
        message: "Registration successful.",
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: "customer",
        },
        token,
      });

      setSecureCookie(response, "auth-token", token, { maxAge: 60 * 60 * 8 });
      auditLog("register-success", "User registered successfully", email, clientIp);
      return response;
    } catch (err: unknown) {
      // handle unique constraint violations
      const prismaError = err && typeof err === "object" && "code" in err ? err : null;
      if (prismaError && (prismaError as { code?: string }).code === "P2002") {
        const target = (prismaError as { meta?: { target?: string[] } }).meta?.target?.[0];
        if (target === "email") {
          auditLog("register-failed", "Email already in use", email, clientIp);
          return NextResponse.json({ success: false, message: "Email already registered." }, { status: 409 });
        } else if (target === "username") {
          auditLog("register-failed", "Username already in use", username, clientIp);
          return NextResponse.json({ success: false, message: "Username already taken." }, { status: 409 });
        } else if (target === "phone") {
          auditLog("register-failed", "Phone already in use", phone, clientIp);
          return NextResponse.json({ success: false, message: "Phone number already registered." }, { status: 409 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ success: false, message: "Unable to process registration request." }, { status: 500 });
  }
}
