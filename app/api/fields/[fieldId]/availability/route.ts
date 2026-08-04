import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FIELD, DEFAULT_FIELD_ID } from "@/lib/venue";

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function buildTimeSlots(date: string, bookedIntervals: Array<{ startTime: string; endTime: string }>) {
  const slots: Array<{ id: string; startTime: string; endTime: string; isAvailable: boolean }> = [];
  const startHour = 6;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

    const isAvailable = !bookedIntervals.some((booking) => booking.startTime < endTime && booking.endTime > startTime);
    slots.push({ id: `${date}-${startTime}`, startTime, endTime, isAvailable });
  }

  return slots;
}

export async function GET(request: Request, props: { params: Promise<{ fieldId: string }> }) {
  const params = await props.params;
  const fieldId = params?.fieldId ?? DEFAULT_FIELD_ID;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ success: false, message: "Date is required." }, { status: 400 });
  }

  if (fieldId !== DEFAULT_FIELD_ID) {
    return NextResponse.json({ success: false, message: "The requested field is not available." }, { status: 404 });
  }

  const range = getDateRange(date);
  if (!range) {
    return NextResponse.json({ success: false, message: "Invalid date format." }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: range.start,
        status: {
          in: ["confirmed", "completed"],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const schedules = buildTimeSlots(date, bookings);

    return NextResponse.json({
      success: true,
      field: DEFAULT_FIELD,
      schedules,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[API] Field availability error for ${fieldId} on ${date}:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    const schedules = buildTimeSlots(date, []);
    return NextResponse.json({ success: true, field: DEFAULT_FIELD, schedules, _debug: `Fallback due to ${errorMsg}` });
  }
}
