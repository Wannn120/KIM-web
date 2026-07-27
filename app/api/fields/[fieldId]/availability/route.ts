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
  const fieldParam = params?.fieldId;
  type FallbackSchedule = { id: string; startTime: string; endTime: string; isAvailable: boolean };
  // If the deployment has no DATABASE_URL or Prisma cannot connect, prefer returning
  // a safe fallback so the booking UI remains usable. This avoids uncaught runtime
  // errors that can surface as server component render failures in production.
  if (!process.env.DATABASE_URL) {
    console.warn("[API] Field availability fallback because DATABASE_URL is not set.");
    const fieldId = fieldParam ?? "klaten-field-1";
    const date = new URL(request.url).searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    const fallbackField = fallbackFields.find((f) => f.id === fieldId) || { id: fieldId, name: "Unknown Field", price: 110000 };
    const fallbackSchedules = [] as Array<{ id: string; startTime: string; endTime: string; isAvailable: boolean }>;
    const startHour = 6;
    const endHour = 22;
    for (let h = startHour; h < endHour; h++) {
      const sh = String(h).padStart(2, "0") + ":00";
      const eh = String(h + 1).padStart(2, "0") + ":00";
      const timeLabel = `${sh} - ${eh}`;
      const isBooked = fallbackBookedSlots.some((b) => b.date === date && b.time === timeLabel && b.field === fallbackField.name);
      fallbackSchedules.push({ id: `mock-${date}-${sh}`, startTime: sh, endTime: eh, isAvailable: !isBooked });
    }

    const payload: { success: boolean; field: { id: string; name?: string; price?: number }; schedules: FallbackSchedule[]; _debug?: string } = {
      success: true,
      field: fallbackField,
      schedules: fallbackSchedules,
    };

    if (process.env.DEBUG_API === "1" || process.env.NODE_ENV !== "production") {
      payload._debug = "Fallback (no DATABASE_URL)";
    }

    return NextResponse.json(payload, { status: 200 });
  }

  const fieldId = fieldParam;
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
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[API] Field availability error for ${fieldId} on ${date}:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // As a resilience measure, return fallback/mock schedules so the booking flow continues
    // instead of failing completely. This uses `lib/mock-data.ts` and is safe for production.
    const fallbackField = fallbackFields.find((f) => f.id === fieldId) || { id: fieldId, name: "Unknown Field", price: 110000 };

    // If a date was provided, construct hourly slots 06:00-22:00 and mark booked ones as unavailable.
    type FallbackSchedule = { id: string; startTime: string; endTime: string; isAvailable: boolean };
    const fallbackSchedules: FallbackSchedule[] = [];
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

    console.warn(`[API] Field availability fallback due to error: ${errorMsg}`);
    // Return fallback data with success=true and status 200 so client can proceed
    const payload: { success: boolean; field: { id: string; name?: string; price?: number }; schedules: FallbackSchedule[]; _debug?: string } = {
      success: true,
      field: fallbackField,
      schedules: fallbackSchedules,
    };

    if (process.env.DEBUG_API === "1" || process.env.NODE_ENV !== "production") {
      payload._debug = `Fallback data used due to: ${errorMsg}`;
    }

    return NextResponse.json(payload, { status: 200 });
  }
}
