import { NextResponse } from "next/server";
import { processWebhookEvent } from "@/lib/payment-service";
import { verifyMidtransSignature } from "@/lib/midtrans";
import type { PaymentStatus } from "@/lib/payment-provider";

function resolveTransactionId(body: Record<string, unknown>) {
  return (
    (typeof body?.transaction_id === "string" && body.transaction_id) ||
    (typeof body?.transactionId === "string" && body.transactionId) ||
    (typeof body?.order_id === "string" && body.order_id) ||
    (typeof body?.orderId === "string" && body.orderId) ||
    ""
  );
}

function resolveTransactionStatus(body: Record<string, unknown>) {
  if (typeof body?.transaction_status === "string") return body.transaction_status;
  if (typeof body?.status === "string") return body.status;
  if (typeof body?.transactionStatus === "string") return body.transactionStatus;
  if (typeof body?.status_code === "string") return body.status_code;
  return "";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-midtrans-signature") ?? request.headers.get("x-signature") ?? "";
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (process.env.NODE_ENV === "production" && (!signature || !verifyMidtransSignature(rawBody, signature))) {
      console.warn("[MIDTRANS] Invalid signature detected", { timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Invalid Midtrans signature." }, { status: 401 });
    }

    const transactionId = resolveTransactionId(body as Record<string, unknown>);
    const status = resolveTransactionStatus(body as Record<string, unknown>) as PaymentStatus;

    if (!transactionId || !status) {
      console.warn("[MIDTRANS] Missing transaction id or status", { body, timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Missing transaction identifier or status." }, { status: 400 });
    }

    console.info("[MIDTRANS] Notification received", { transactionId, status, timestamp: new Date().toISOString() });
    await processWebhookEvent(transactionId, status);

    return NextResponse.json({ success: true, message: "Midtrans notification processed." });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[MIDTRANS] Notification error:", { message: errorMsg, stack: error instanceof Error ? error.stack : undefined, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, message: `Unable to process Midtrans notification. ${errorMsg}` }, { status: 500 });
  }
}
