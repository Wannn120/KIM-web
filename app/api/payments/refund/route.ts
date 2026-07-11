import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transactionId = typeof body?.transactionId === "string" ? body.transactionId : "";

    if (!transactionId) {
      return NextResponse.json({ success: false, message: "transactionId is required." }, { status: 400 });
    }

    await processWebhookEvent(transactionId, "refunded");

    return NextResponse.json({
      success: true,
      message: "Refund processed.",
      transactionId,
      status: "refunded",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
