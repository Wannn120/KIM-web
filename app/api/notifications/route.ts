import { NextResponse } from "next/server";
import { getNotificationHistory, sendNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = typeof body?.event === "string" ? body.event : "";
    const payload = body?.payload ?? {};

    if (!event) {
      return NextResponse.json({ success: false, message: "event is required." }, { status: 400 });
    }

    const result = await sendNotification(event as any, payload);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Unable to dispatch notification." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: getNotificationHistory() });
}
