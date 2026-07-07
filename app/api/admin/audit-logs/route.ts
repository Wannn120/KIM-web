import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { requireAuth } from "@/lib/auth";
import { applySecurityHeaders } from "@/lib/security";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ["admin", "owner"]);
  if (!auth.ok) {
    return auth.response;
  }

  const response = NextResponse.json({ success: true, data: getAuditLogs() });
  return applySecurityHeaders(response, request);
}
