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

    return NextResponse.json({
      success: true,
      transaction: result,
      snapUrl: (result as any).snapUrl,
      snapToken: (result as any).snapToken,
    }, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
