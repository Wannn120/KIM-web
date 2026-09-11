import { NextResponse, type NextRequest } from "next/server";
import { expirePendingPayments } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    await expirePendingPayments();
    return NextResponse.json({ success: true, message: "Expired pending payments reconciled." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[CRON] expire-pending failed", { message });
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
