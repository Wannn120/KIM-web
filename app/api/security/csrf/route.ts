import { NextResponse } from "next/server";
import { createCsrfToken, setSecureCookie, verifyCsrfToken } from "@/lib/security";
import { auditLog } from "@/lib/audit-log";

export async function GET(request: Request) {
  const token = createCsrfToken();
  const response = NextResponse.json({ success: true, data: { csrfToken: token } });
  setSecureCookie(response, "csrf-token", token, { maxAge: 60 * 60 * 6 });
  auditLog("csrf-issued", "Issued CSRF token", undefined, request.headers.get("x-forwarded-for") ?? undefined);
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const suppliedToken = typeof body?.csrfToken === "string" ? body.csrfToken : "";
    const cookieToken = request.headers.get("cookie")?.match(/csrf-token=([^;]+)/)?.[1] ?? "";
    const isValid = verifyCsrfToken(suppliedToken || cookieToken);

    if (!isValid) {
      return NextResponse.json({ success: false, message: "Invalid CSRF token." }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: "CSRF token validated." });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to validate CSRF token." }, { status: 500 });
  }
}
