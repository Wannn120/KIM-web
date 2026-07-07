import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";

    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment cancelled.",
      payment: {
        orderId,
        status: "cancelled",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to cancel payment." }, { status: 500 });
  }
}
