import { NextResponse } from "next/server";
import { getAdminSummary } from "@/lib/admin-dashboard";

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: getAdminSummary() });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to load admin summary." }, { status: 500 });
  }
}
