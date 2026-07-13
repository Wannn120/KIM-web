import { NextResponse } from "next/server";
import { clearSecureCookie } from "@/lib/security";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out." });
  clearSecureCookie(response, "auth-token");
  return response;
}
