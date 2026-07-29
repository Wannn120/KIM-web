import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function parseTimeToMinutes(timeValue: string) {
  const [hourText, minuteText] = timeValue.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
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
  if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) return [];
  const blocks: Array<{ start: string; end: string }> = [];
  for (let cursor = startMinutes; cursor < endMinutes; cursor += 60) {
    const nextCursor = Math.min(cursor + 60, endMinutes);
    blocks.push({ start: formatMinutesToTime(cursor), end: formatMinutesToTime(nextCursor) });
  }
  return blocks;
}

export async function GET(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadBookings") && !hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        field: { select: { id: true, name: true, location: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("[ADMIN] Booking list error:", error);
    return NextResponse.json({ success: false, message: "Unable to list bookings." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageBookings")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();
    const fieldId = typeof body.fieldId === "string" ? body.fieldId.trim() : "";
    const bookingDate = typeof body.bookingDate === "string" ? body.bookingDate.trim() : "";
    const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
    const customerEmail = typeof body.customerEmail === "string" ? body.customerEmail.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    if (!fieldId || !bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const field = await prisma.field.findUnique({ where: { id: fieldId }, select: { id: true, price: true } });
    if (!field) {
      return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    }

    const blocks = getRequestedScheduleBlocks(startTime, endTime);
    if (blocks.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid booking time range." }, { status: 400 });
    }

    const scheduleBlocks = await prisma.fieldSchedule.findMany({
      where: {
        fieldId: field.id,
        date: { gte: range.start, lt: range.end },
        startTime: { in: blocks.map((block) => block.start) },
        isAvailable: true,
      },
      select: { startTime: true },
    });

    const availableStarts = new Set(scheduleBlocks.map((block) => block.startTime));
    const hasCompleteAvailability = blocks.every((block) => availableStarts.has(block.start));
    if (!hasCompleteAvailability) {
      return NextResponse.json({ success: false, message: "Requested slot is not available." }, { status: 409 });
    }

    const durationHours = Math.max(Math.ceil((parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) / 60), 1);
    const totalPrice = field.price * durationHours;

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          fieldId: field.id,
          bookingDate: range.start,
          startTime,
          endTime,
          durationHours,
          totalPrice,
          customerName,
          customerPhone,
          customerEmail,
          status: "confirmed",
          notes,
        },
      });

      await tx.fieldSchedule.updateMany({
        where: {
          fieldId: field.id,
          date: range.start,
          startTime: { in: blocks.map((block) => block.start) },
        },
        data: { isAvailable: false },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to create booking." }, { status: 500 });
  }
}
