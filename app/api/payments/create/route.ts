import { NextResponse } from "next/server";
import { createPaymentTransaction } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createPaymentTransaction({
      bookingId: typeof body?.bookingId === "string" ? body.bookingId : "",
      amount: typeof body?.amount === "number" ? body.amount : 0,
      paymentMethod: typeof body?.paymentMethod === "string" ? body.paymentMethod : "Midtrans",
      customerName: typeof body?.customerName === "string" ? body.customerName : "Guest",
      email: typeof body?.email === "string" ? body.email : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
    });

    const snapUrl = typeof result === 'object' && result !== null && 'snapUrl' in result ? (result as Record<string, unknown>).snapUrl : null;
    const snapToken = typeof result === 'object' && result !== null && 'snapToken' in result ? (result as Record<string, unknown>).snapToken : null;
    
    return NextResponse.json({
      success: true,
      transaction: result,
      snapUrl,
      snapToken,
    }, { status: 201 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] Payment creation error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { success: false, message: `Payment error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
