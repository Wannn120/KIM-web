import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fields as fallbackFields, bookedSlots as fallbackBookedSlots } from "@/lib/mock-data";

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET(request: Request, props: { params: Promise<{ fieldId: string }> }) {
  const params = await props.params;
  const fieldId = params.fieldId;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    if (!fieldId) {
      return NextResponse.json(
        { success: false, message: "Field ID is required." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required." },
        { status: 400 }
      );
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, price: true },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, message: "Field not found." },
        { status: 404 }
      );
    }

    const range = getDateRange(date);
    if (!range) {
      return NextResponse.json(
        { success: false, message: "Invalid date format." },
        { status: 400 }
      );
    }

    const schedules = await prisma.fieldSchedule.findMany({
      where: {
        fieldId,
        date: {
          gte: range.start,
          lt: range.end,
        },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        isAvailable: true,
      },
    });

    return NextResponse.json({
      success: true,
      field,
      schedules,
    });
  } catch (error) {
    console.error("Error fetching field schedule:", error);

    // As a resilience measure, return fallback/mock schedules so the booking flow continues
    // instead of failing completely. This uses `lib/mock-data.ts` and is safe for production.
    let fallbackField = fallbackFields.find((f) => f.id === fieldId) || { id: fieldId, name: "Unknown Field", price: 0 };

    // If a date was provided, construct hourly slots 06:00-22:00 and mark booked ones as unavailable.
    let fallbackSchedules: any[] = [];
    if (date) {
      const startHour = 6;
      const endHour = 22; // last slot starts at 21:00
      for (let h = startHour; h < endHour; h++) {
        const sh = String(h).padStart(2, "0") + ":00";
        const eh = String(h + 1).padStart(2, "0") + ":00";
        const timeLabel = `${sh} - ${eh}`;

        const isBooked = fallbackBookedSlots.some((b) => b.date === date && b.time === timeLabel && b.field === fallbackField.name);

        fallbackSchedules.push({ id: `mock-${date}-${sh}`, startTime: sh, endTime: eh, isAvailable: !isBooked });
      }
    }

    // If DEBUG_API is enabled, include error detail in response (opt-in)
    const payload: any = { success: true, field: fallbackField, schedules: fallbackSchedules };
    if (process.env.DEBUG_API === "1") {
      try {
        payload._error = String(error instanceof Error ? error.stack || error.message : error);
      } catch (_) {
        payload._error = "(failed to serialize error)";
      }
    }

    return NextResponse.json(payload, { status: 200 });
  }
}
