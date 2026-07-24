import { NextResponse, type NextRequest } from "next/server";
import { getAdminSummary } from "@/lib/admin-dashboard";
import { ADMIN_ROLES, getAuthenticatedAdmin, isAdminRoleAllowed } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    if (!isAdminRoleAllowed(admin.role, [ADMIN_ROLES.manager, ADMIN_ROLES.superAdmin])) {
      return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: getAdminSummary() });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load admin summary." }, { status: 500 });
  }
}
