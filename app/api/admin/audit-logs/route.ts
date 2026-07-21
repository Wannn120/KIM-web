import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { applySecurityHeaders } from "@/lib/security";

export async function GET() {
  const response = NextResponse.json({ success: true, data: getAuditLogs() });
  return applySecurityHeaders(response);
}
