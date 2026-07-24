import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { getRateLimitResult, sanitizeObject, applySecurityHeaders } from "@/lib/security";
import { prisma } from "@/lib/prisma";

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

    if (!fieldId || !bookingDate || !startTime || !endTime) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, price: true },
    });

    if (!field) {
      return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    }

    const requestedBlocks = getRequestedScheduleBlocks(startTime, endTime);
    if (requestedBlocks.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
    }

    const scheduleBlocks = await prisma.fieldSchedule.findMany({
      where: {
        fieldId,
        date: {
          gte: range.start,
          lt: range.end,
        },
        startTime: {
          in: requestedBlocks.map((block) => block.start),
        },
        isAvailable: true,
      },
      select: {
        startTime: true,
      },
    });

    const availableStarts = new Set(scheduleBlocks.map((block) => block.startTime));
    const hasCompleteAvailability = requestedBlocks.every((block) => availableStarts.has(block.start));

    if (!hasCompleteAvailability) {
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
    const totalPrice = field.price * durationHours;

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          fieldId,
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
          fieldId: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          totalPrice: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.fieldSchedule.updateMany({
        where: {
          fieldId,
          date: range.start,
          startTime: {
            in: requestedBlocks.map((block) => block.start),
          },
        },
        data: { isAvailable: false },
      });

      return newBooking;
    });

    auditLog("booking-created", `Booking ${booking.id} created for ${field.name}`, customerEmail, clientIp);

    const response = NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create booking." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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
        field: {
          select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
          },
        },
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
            paymentLinkUrl: true,
            createdAt: true,
            updatedAt: true,
            paidAt: true,
            expiredAt: true,
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch bookings." },
      { status: 500 }
    );
  }
}
