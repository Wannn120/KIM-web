import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transactionId =
      typeof body?.transactionId === "string"
        ? body.transactionId
        : typeof body?.orderId === "string"
        ? body.orderId
        : typeof body?.transaction_id === "string"
        ? body.transaction_id
        : "";
    const status =
      typeof body?.status === "string"
        ? body.status
        : typeof body?.transaction_status === "string"
        ? body.transaction_status
        : "";

    if (!transactionId || !status) {
      return NextResponse.json({ success: false, message: "Missing transaction identifier or status." }, { status: 400 });
    }

    await processWebhookEvent(transactionId, status);
    return NextResponse.json({ success: true, message: "Webhook processed." });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
