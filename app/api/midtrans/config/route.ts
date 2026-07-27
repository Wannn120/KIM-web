import { NextResponse } from "next/server";
import { getMidtransConfig } from "@/lib/midtrans";

export async function GET() {
  const { clientKey, snapScriptUrl } = getMidtransConfig();

  return NextResponse.json({
    success: true,
    clientKey,
    snapScriptUrl,
  });
}
