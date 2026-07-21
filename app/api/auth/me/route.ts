import { NextResponse, type NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({ success: false, message: "Authentication is disabled in guest-only booking mode." }, { status: 404 });
}
