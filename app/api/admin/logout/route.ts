import { NextResponse, type NextRequest } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { applySecurityHeaders } from "@/lib/security";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true, message: "Admin session cleared." });
  return applySecurityHeaders(clearAdminSessionCookie(response));
}
