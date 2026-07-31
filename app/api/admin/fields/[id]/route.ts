import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { DEFAULT_FIELD, DEFAULT_FIELD_ID } from "@/lib/venue";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const paramsResolved = await params;
    const id = paramsResolved.id;
    if (id !== DEFAULT_FIELD_ID) {
      return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: DEFAULT_FIELD });
  } catch (error) {
    console.error("[ADMIN] Get field error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve field." }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ success: false, message: "Field updates are disabled for this single-venue deployment." }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Field deletion is disabled for this single-venue deployment." }, { status: 410 });
}
