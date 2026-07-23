import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security";
import { getAuthenticatedAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);

    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    return applySecurityHeaders(NextResponse.json({ success: true, user: admin }));
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
