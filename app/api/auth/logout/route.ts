import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, message: "Logout is disabled in guest-only booking mode." }, { status: 404 });
}
