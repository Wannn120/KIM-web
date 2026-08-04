import { NextResponse } from "next/server";
import { getPaymentTransaction, getPaymentTransactionByBookingId } from "@/lib/payment-service";
import { isUuid } from "@/lib/payment-utils";

function getErrorStatus(message: string) {
  if (/not found/i.test(message)) return 404;
  return 500;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";
  const bookingId = url.searchParams.get("bookingId")?.trim() ?? "";

  if (!transactionId && !bookingId) {
    return NextResponse.json({ success: false, error: "transactionId or bookingId is required." }, { status: 400 });
  }

  if (bookingId && !transactionId) {
    if (!isUuid(bookingId)) {
      return NextResponse.json({ success: false, error: "Invalid bookingId format." }, { status: 400 });
    }
  }

  try {
    let payment = null;
    if (transactionId) {
      try {
        payment = await getPaymentTransaction(transactionId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Payment record not found")) {
          payment = null;
        } else {
          throw error;
        }
      }
    } else {
      payment = await getPaymentTransactionByBookingId(bookingId);
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = getErrorStatus(message);
    console.error("[API] /api/payments/transaction error:", {
      message,
      transactionId,
      bookingId,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
