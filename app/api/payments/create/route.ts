import { NextResponse } from "next/server";
import { createMidtransTransaction } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : `order-${Date.now()}`;
    const amount = typeof body?.amount === "number" ? body.amount : 0;
    const customer = body?.customer ?? {};

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "A valid amount is required." },
        { status: 400 }
      );
    }

    const transaction = await createMidtransTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: typeof customer?.firstName === "string" ? customer.firstName : "Customer",
        email: typeof customer?.email === "string" ? customer.email : "customer@example.com",
        phone: typeof customer?.phone === "string" ? customer.phone : "",
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/booking-history`,
      },
      item_details: [
        {
          id: "field-booking",
          price: amount,
          quantity: 1,
          name: "Mini soccer field booking",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Transaction created.",
      transaction,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to create payment transaction." },
      { status: 500 }
    );
  }
}
