import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_ROLES, getAuthenticatedAdmin, isAdminRoleAllowed } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
  }

  if (!isAdminRoleAllowed(admin.role, [ADMIN_ROLES.manager, ADMIN_ROLES.superAdmin])) {
    return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
  }

  const csv = [
    "date,field,bookings,revenue",
    "2026-07-07,Elite Turf 1,24,1800000",
    "2026-07-06,Club Arena,18,1500000",
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=admin-report.csv",
    },
  });
}
