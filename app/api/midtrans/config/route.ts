import { NextResponse } from "next/server";

export async function GET() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? "";
  const snapScriptUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? "https://app.sandbox.midtrans.com/snap/snap.js";

  return NextResponse.json({
    success: true,
    clientKey,
    snapScriptUrl,
  });
}
