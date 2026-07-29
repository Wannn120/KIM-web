import { NextResponse, type NextRequest } from "next/server";
import { getAdminSummary } from "@/lib/admin-dashboard";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    const data = await getAdminSummary();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load admin summary." }, { status: 500 });
  }
}
