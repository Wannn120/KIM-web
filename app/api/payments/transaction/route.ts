import { NextResponse } from "next/server";
import { getPaymentTransaction } from "@/lib/payment-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json({ success: false, message: "transactionId is required." }, { status: 400 });
    }

    const payment = await getPaymentTransaction(transactionId);
    return NextResponse.json({ success: true, payment });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
