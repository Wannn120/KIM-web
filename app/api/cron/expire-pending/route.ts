import { NextResponse } from "next/server";
import { expirePendingPayments } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await expirePendingPayments();
    return NextResponse.json({ success: true, message: "Expired pending payments reconciled." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CRON] expire-pending failed", { message });
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
