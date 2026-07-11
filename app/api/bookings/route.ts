import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { createBooking } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";
import { getRateLimitResult, sanitizeObject, applySecurityHeaders } from "@/lib/security";
import { validateBookingPayload } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const fieldId = typeof safeBody?.fieldId === "string" ? safeBody.fieldId : "";
    const customerId = typeof safeBody?.customerId === "string" ? safeBody.customerId : "";
    const startAt = typeof safeBody?.startAt === "string" ? safeBody.startAt : "";
    const endAt = typeof safeBody?.endAt === "string" ? safeBody.endAt : "";
    const timezone = typeof safeBody?.timezone === "string" ? safeBody.timezone : "UTC";
    const customerName = typeof safeBody?.customerName === "string" ? safeBody.customerName : "Guest";
    const email = typeof safeBody?.email === "string" ? safeBody.email : "";
    const phone = typeof safeBody?.phone === "string" ? safeBody.phone : "";
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`booking:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many booking attempts. Please try again later." }, { status: 429 });
    }

    const validation = validateBookingPayload(safeBody as Record<string, unknown>);
    if (!validation.ok) {
      auditLog("booking-rejected", validation.message, customerId || "unknown", clientIp);
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
    }

    const result = await createBooking({
      fieldId,
      customerId,
      startAt,
      endAt,
      timezone,
    });

    if (result.success && result.booking) {
      auditLog("booking-created", `Booking ${result.booking.id} created`, customerId, clientIp);
    }

    const response = NextResponse.json(result, { status: result.statusCode });
    return applySecurityHeaders(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Unable to create booking." },
      { status: 500 }
    );
  }
}
