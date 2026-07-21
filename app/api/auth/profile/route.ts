import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(_request: NextRequest) {
  return NextResponse.json({ success: false, message: "Profile management is disabled in guest-only booking mode." }, { status: 404 });
}
