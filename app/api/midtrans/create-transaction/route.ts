import { NextResponse } from "next/server";
import { createPaymentTransaction } from "@/lib/payment-service";

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

    if (!bookingId) {
      return NextResponse.json({ success: false, message: "bookingId is required." }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "A valid amount is required." }, { status: 400 });
    }

    const result = await createPaymentTransaction({
      bookingId,
      amount,
      paymentMethod,
      customerName,
      email,
      phone,
      appBaseUrl,
    });

    return NextResponse.json({
      success: true,
      transaction: result,
      snapToken: result.snapToken,
      snapUrl: result.snapUrl,
    }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] Midtrans create transaction error:", { message: errorMsg, stack: error instanceof Error ? error.stack : undefined, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, message: `Unable to create Midtrans transaction. ${errorMsg}` }, { status: 500 });
  }
}
