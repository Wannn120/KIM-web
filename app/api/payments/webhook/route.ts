import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/payment-service";
import { verifyMidtransSignature } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-midtrans-signature") ?? request.headers.get("x-signature") ?? "";
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (process.env.NODE_ENV === "production" && (!signature || !verifyMidtransSignature(rawBody, signature))) {
      return NextResponse.json({ success: false, message: "Invalid Midtrans signature." }, { status: 401 });
    }

    const transactionId =
      typeof body?.transactionId === "string"
        ? body.transactionId
        : typeof body?.orderId === "string"
        ? body.orderId
        : typeof body?.transaction_id === "string"
        ? body.transaction_id
        : typeof body?.order_id === "string"
        ? body.order_id
        : "";
    const status =
      typeof body?.status === "string"
        ? body.status
        : typeof body?.transaction_status === "string"
        ? body.transaction_status
        : typeof body?.transactionStatus === "string"
        ? body.transactionStatus
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
