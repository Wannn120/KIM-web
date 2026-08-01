import { NextResponse } from "next/server";
import { getMidtransConfig } from "@/lib/midtrans";

export async function GET() {
  const { clientKey, snapScriptUrl, serverKey } = getMidtransConfig();
  const mockMode = !serverKey.trim();

  return NextResponse.json({
    success: true,
    clientKey,
    snapScriptUrl,
    mockMode,
  });
}
