import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Webhook test endpoint is disabled in production." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const transactionId = typeof body?.transactionId === "string" ? body.transactionId.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim().toLowerCase() : "";

    if (!transactionId) {
      return NextResponse.json({ success: false, message: "transactionId is required." }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ success: false, message: "status is required." }, { status: 400 });
    }

    if (!["pending", "success", "cancelled", "failed", "expired", "refunded"].includes(status)) {
      return NextResponse.json({ success: false, message: "status must be one of pending, success, cancelled, failed, expired, refunded." }, { status: 400 });
    }

    await processWebhookEvent(transactionId, status as "pending" | "success" | "cancelled" | "failed" | "expired" | "refunded");

    return NextResponse.json({
      success: true,
      message: "Webhook test executed successfully.",
      transactionId,
      status,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
