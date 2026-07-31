import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { expirePendingPayments } from "@/lib/payment-service";
import { getRateLimitResult, sanitizeObject, applySecurityHeaders } from "@/lib/security-headers";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FIELD_ID, DEFAULT_FIELD_NAME, DEFAULT_FIELD_PRICE } from "@/lib/venue";

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return NaN;
  }

  return hour * 60 + minute;
}

function formatMinutesToTime(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getRequestedScheduleBlocks(startTime: string, endTime: string) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
    return [];
  }

  const blocks: Array<{ start: string; end: string }> = [];
  for (let cursor = startMinutes; cursor < endMinutes; cursor += 60) {
    const nextCursor = Math.min(cursor + 60, endMinutes);
    blocks.push({
      start: formatMinutesToTime(cursor),
      end: formatMinutesToTime(nextCursor),
    });
  }

  return blocks;
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const fieldId = typeof safeBody?.fieldId === "string" ? safeBody.fieldId : "";
    const bookingDate = typeof safeBody?.bookingDate === "string" ? safeBody.bookingDate : "";
    const startTime = typeof safeBody?.startTime === "string" ? safeBody.startTime : "";
    const endTime = typeof safeBody?.endTime === "string" ? safeBody.endTime : "";
    const customerName = typeof safeBody?.customerName === "string" ? safeBody.customerName.trim() : "";
    const customerPhone = typeof safeBody?.customerPhone === "string" ? safeBody.customerPhone.trim() : "";
    const customerEmail = typeof safeBody?.customerEmail === "string" ? safeBody.customerEmail.trim() : "";
    const validateOnly = safeBody?.validateOnly === true;
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`booking:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many booking attempts. Please try again later." }, { status: 429 });
    }

    if (fieldId && fieldId !== DEFAULT_FIELD_ID) {
      return NextResponse.json({ success: false, message: "The selected field is not available." }, { status: 404 });
    }

    if (!bookingDate || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime);
    if (requestedBlocks.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
    }

    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        bookingDate: range.start,
        status: {
          notIn: ["cancelled", "expired"],
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingBooking) {
      return NextResponse.json({ success: false, message: "This time slot is not available." }, { status: 409 });
    }

    if (validateOnly) {
      return NextResponse.json({ success: true, message: "Slot available." });
    }

    if (!customerName || !customerPhone || !customerEmail) {
      return NextResponse.json({ success: false, message: "Customer name, email, and phone are required." }, { status: 400 });
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const durationHours = Math.max(Math.ceil((endMinutes - startMinutes) / 60), 1);
    const totalPrice = DEFAULT_FIELD_PRICE * durationHours;

    const booking = await prisma.booking.create({
      data: {
        bookingDate: range.start,
        startTime,
        endTime,
        durationHours,
        totalPrice,
        customerName,
        customerPhone,
        customerEmail,
        status: "pending",
      },
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        status: true,
        createdAt: true,
      },
    });

    auditLog("booking-created", `Booking ${booking.id} created for ${DEFAULT_FIELD_NAME}`, customerEmail, clientIp);

    const response = NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });

    return applySecurityHeaders(response);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[API] Booking creation error:", {
      message: errorMsg,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });

    // Return more specific error messages for known scenarios
    if (errorMsg.includes("Unique constraint failed")) {
      return NextResponse.json(
        { success: false, message: "This time slot is no longer available. Please select another slot.", error: errorMsg },
        { status: 409 }
      );
    }

    if (errorMsg.includes("Field not found")) {
      return NextResponse.json(
        { success: false, message: "The selected field is no longer available.", error: errorMsg },
        { status: 404 }
      );
    }

    if (errorMsg.includes("invalid character") || errorMsg.includes("P2023")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking details. Please return to the booking page and select a valid slot.",
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    // Fallback: return the actual error message to help debugging in production.
    return NextResponse.json(
      { success: false, message: "Unable to create booking. Please try again or contact support.", error: errorMsg, stack: errorStack },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await expirePendingPayments();

    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.trim() ?? "";
    const phone = url.searchParams.get("phone")?.trim() ?? "";

    if (!email && !phone) {
      return NextResponse.json({ success: false, message: "Email or phone is required to search bookings." }, { status: 400 });
    }

    const conditions: Array<Record<string, unknown>> = [];
    if (email) conditions.push({ customerEmail: email });
    if (phone) conditions.push({ customerPhone: phone });

    const bookings = await prisma.booking.findMany({
      where: {
        OR: conditions,
      },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            transactionId: true,
            status: true,
            amount: true,
            provider: true,
            paymentMethod: true,
            snapUrl: true,
            createdAt: true,
            updatedAt: true,
            paidAt: true,
            expiredAt: true,
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    const normalizedBookings = bookings.map((booking) => ({
      ...booking,
      fieldName: DEFAULT_FIELD_NAME,
    }));

    return NextResponse.json({
      success: true,
      bookings: normalizedBookings,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[API] Booking retrieval error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: false, message: "Unable to fetch bookings. Please try again." },
      { status: 500 }
    );
  }
}
