import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedAdmin, hasAdminPermission } from "@/lib/admin-auth";

/** @deprecated SQL query endpoint removed for security — $queryRawUnsafe is a SQL injection vector. */

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    if (!hasAdminPermission(admin, "canManageAdmins")) {
      return NextResponse.json({ success: false, message: "Only super admins can access this endpoint." }, { status: 403 });
    }

    return NextResponse.json(
      { success: false, message: "SQL query endpoint has been disabled for security. Use the admin dashboard instead." },
      { status: 410 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Endpoint removed." },
      { status: 410 }
    );
  }
}
