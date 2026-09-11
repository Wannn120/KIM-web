import { NextResponse } from "next/server";
import { getNotificationHistory, sendNotification } from "@/lib/notifications";
import type { NotificationEvent, NotificationPayload } from "@/lib/notifications";
import { getAuthenticatedAdminFromToken } from "@/lib/admin-auth";

const ALLOWED_EVENTS: NotificationEvent[] = ["email-confirmation", "whatsapp-confirmation", "booking-reminder", "payment-reminder", "booking-cancelled", "refund-processed"];

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin authentication required." }, { status: 401 });
    }
    const body = await request.json();
    const event = typeof body?.event === "string" ? body.event : "";
    const payload = (body?.payload ?? {}) as NotificationPayload;

    if (!event) {
      return NextResponse.json({ success: false, message: "event is required." }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.includes(event as NotificationEvent)) {
      return NextResponse.json({ success: false, message: "Invalid event type." }, { status: 400 });
    }

    const result = await sendNotification(event as NotificationEvent, payload);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to dispatch notification." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin authentication required." }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: getNotificationHistory() });
}
