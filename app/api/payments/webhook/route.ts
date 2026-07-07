import { NextResponse } from "next/server";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { sendNotification } from "@/lib/notifications";

const paymentStateMap = new Map<string, { status: string; updatedAt: string; idempotencyKey?: string }>();

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") ?? "";
    const body = JSON.parse(rawBody || "{}");

    if (!verifyMidtransSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, message: "Invalid signature." }, { status: 401 });
    }

    const orderId = body?.order_id ?? body?.transaction_details?.order_id;
    const transactionStatus = body?.transaction_status ?? "unknown";
    const idempotencyKey = body?.order_id;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Missing order_id." }, { status: 400 });
    }

    if (paymentStateMap.get(orderId)?.idempotencyKey === idempotencyKey) {
      return NextResponse.json({ success: true, message: "Duplicate webhook ignored." });
    }

    paymentStateMap.set(orderId, {
      status: transactionStatus,
      updatedAt: new Date().toISOString(),
      idempotencyKey,
    });

    if (transactionStatus === "settlement") {
      await sendNotification("email-confirmation", {
        bookingId: orderId,
        amount: body?.gross_amount,
      });
      return NextResponse.json({ success: true, message: "Payment confirmed." });
    }

    if (transactionStatus === "expire") {
      await sendNotification("payment-reminder", {
        bookingId: orderId,
      });
      return NextResponse.json({ success: true, message: "Payment expired." });
    }

    if (transactionStatus === "cancel") {
      await sendNotification("booking-cancelled", {
        bookingId: orderId,
        reason: "payment was cancelled",
      });
      return NextResponse.json({ success: true, message: "Payment cancelled." });
    }

    return NextResponse.json({ success: true, message: "Webhook processed." });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to process webhook." }, { status: 500 });
  }
}
