import { NextResponse } from "next/server";
import { PaymentStatus } from "@/lib/payment-provider";
import { processWebhookEvent } from "@/lib/payment-service";
import { verifyMidtransSignature } from "@/lib/midtrans";

function resolveTransactionId(body: Record<string, unknown>) {
  return (
    (typeof body?.transactionId === "string" && body.transactionId) ||
    (typeof body?.orderId === "string" && body.orderId) ||
    (typeof body?.transaction_id === "string" && body.transaction_id) ||
    (typeof body?.order_id === "string" && body.order_id) ||
    ""
  );
}

function resolveTransactionStatus(body: Record<string, unknown>): PaymentStatus | "" {
  if (typeof body?.transaction_status === "string") return body.transaction_status as PaymentStatus;
  if (typeof body?.status === "string") return body.status as PaymentStatus;
  if (typeof body?.transactionStatus === "string") return body.transactionStatus as PaymentStatus;
  if (typeof body?.status_code === "string") return body.status_code as PaymentStatus;
  return "";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-midtrans-signature") ?? request.headers.get("x-signature") ?? "";
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (process.env.NODE_ENV === "production" && (!signature || !verifyMidtransSignature(rawBody, signature))) {
      console.warn("[WEBHOOK] Invalid Midtrans signature detected", { timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Invalid Midtrans signature." }, { status: 401 });
    }

    const transactionId = resolveTransactionId(body as Record<string, unknown>);
    const status = resolveTransactionStatus(body as Record<string, unknown>);

    if (!transactionId || !status) {
      console.warn("[WEBHOOK] Missing transaction ID or status", { body, timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Missing transaction identifier or status." }, { status: 400 });
    }

    console.info("[WEBHOOK] Processing payment webhook", { transactionId, status, timestamp: new Date().toISOString() });
    
    await processWebhookEvent(transactionId, status);
    return NextResponse.json({ success: true, message: "Webhook processed." });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WEBHOOK] Error processing webhook:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: false, message: `Webhook error: ${errorMsg}` }, { status: 500 });
  }
}
