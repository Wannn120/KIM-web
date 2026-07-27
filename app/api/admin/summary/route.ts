import { NextResponse, type NextRequest } from "next/server";
import { getAdminSummary } from "@/lib/admin-dashboard";
import { getAuthenticatedAdmin, hasAdminPermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    if (!hasAdminPermission(admin, "canViewReports")) {
      return NextResponse.json({ success: false, message: "Insufficient admin privileges." }, { status: 403 });
    }

    const data = await getAdminSummary();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load admin summary." }, { status: 500 });
  }
}
