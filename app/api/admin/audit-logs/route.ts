import { NextResponse, type NextRequest } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { getAuthenticatedAdmin, hasAdminPermission } from "@/lib/admin-auth";
import { applySecurityHeaders } from "@/lib/security";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
  }

  if (!hasAdminPermission(admin, "canViewReports")) {
    return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, data: getAuditLogs() });
  return applySecurityHeaders(response);
}
