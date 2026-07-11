import { NextResponse } from "next/server";
import { createPaymentTransaction } from "@/lib/payment-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transaction = await createPaymentTransaction({
      bookingId: typeof body?.bookingId === "string" ? body.bookingId : "",
      amount: typeof body?.amount === "number" ? body.amount : 0,
      paymentMethod: typeof body?.paymentMethod === "string" ? body.paymentMethod : "QRIS",
      customerName: typeof body?.customerName === "string" ? body.customerName : "Guest",
      email: typeof body?.email === "string" ? body.email : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
