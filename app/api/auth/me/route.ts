import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Authentication is disabled in guest-only booking mode." }, { status: 404 });
}
