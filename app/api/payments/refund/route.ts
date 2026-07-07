import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";

    if (!orderId) {
      return NextResponse.json({ success: false, message: "orderId is required." }, { status: 400 });
    }

    await sendNotification("refund-processed", {
      bookingId: orderId,
      customerName: typeof body?.customerName === "string" ? body.customerName : "Guest",
    });

    return NextResponse.json({
      success: true,
      message: "Refund initiated.",
      refund: {
        orderId,
        status: "pending",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to process refund." }, { status: 500 });
  }
}
