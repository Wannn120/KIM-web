import { NextResponse } from "next/server";
import { createPaymentTransaction } from "@/lib/payment-service";

function getErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/gross_amount|item_details|order_id|customer_details|email|phone|amount|bookingId|validation/i.test(message)) {
    return 422;
  }
  if (/midtrans|server key|credential|authentication|unauthorized|forbidden/i.test(message)) {
    return 502;
  }
  return 500;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(/:$/, "");
    const appBaseUrl = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://klaten-international-minisoccer.vercel.app";

    const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
    const amount = typeof body?.amount === "number" ? body.amount : typeof body?.amount === "string" ? Number(body.amount) : 0;
    const paymentMethod = typeof body?.paymentMethod === "string" ? body.paymentMethod : "Midtrans";
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : undefined;
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;
    const phone = typeof body?.phone === "string" ? body.phone.trim() : undefined;
    const forceNew = body?.forceNew === true;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "bookingId is required." }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "A valid amount is required." }, { status: 422 });
    }

    const result = await createPaymentTransaction({
      bookingId,
      amount,
      paymentMethod,
      customerName,
      email,
      phone,
      appBaseUrl,
      forceNew,
    });

    return NextResponse.json({
      success: true,
      transaction: result,
      snapToken: result.snapToken,
      snapUrl: result.snapUrl,
    }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const status = getErrorStatus(error);
    console.error("[API] Midtrans create transaction error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: false, error: errorMsg }, { status });
  }
}
