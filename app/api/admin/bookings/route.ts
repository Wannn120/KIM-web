import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { DEFAULT_FIELD_ID } from "@/lib/venue";

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

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    const limit = Math.max(Number(url.searchParams.get("limit") || "6"), 1);
    const q = (url.searchParams.get("q") || "").trim();
    const date = url.searchParams.get("date") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (date) {
      const range = getDateRange(date);
      if (range) where.bookingDate = { gte: range.start, lt: range.end };
    }

    const total = await prisma.booking.count({ where });
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const normalizedBookings = bookings.map((booking) => ({
      ...booking,
      fieldName: "Lapangan Klaten International",
    }));

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return NextResponse.json({ success: true, data: normalizedBookings, total, page, limit, totalPages });
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

    if (!bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    if (fieldId && fieldId !== DEFAULT_FIELD_ID) {
      return NextResponse.json({ success: false, message: "The selected field is not available." }, { status: 404 });
    }

    const range = getDateRange(bookingDate);
    if (!range) {
      return NextResponse.json({ success: false, message: "Invalid booking date." }, { status: 400 });
    }

    const blocks = getRequestedScheduleBlocks(startTime, endTime);
    if (blocks.length === 0) {
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
      return NextResponse.json({ success: false, message: "Requested slot is not available." }, { status: 409 });
    }

    const durationHours = Math.max(Math.ceil((parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)) / 60), 1);
    const totalPrice = 110000 * durationHours;

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
        status: "confirmed",
        notes,
      },
    });

    return NextResponse.json({ success: true, data: booking }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create booking error:", error);
    return NextResponse.json({ success: false, message: "Unable to create booking." }, { status: 500 });
  }
}
