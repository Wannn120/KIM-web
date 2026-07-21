import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Profile management is disabled in guest-only booking mode." }, { status: 404 });
}
