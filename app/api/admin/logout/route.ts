import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { applySecurityHeaders } from "@/lib/security-headers";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Admin session cleared." });
  return applySecurityHeaders(clearAdminSessionCookie(response));
}
