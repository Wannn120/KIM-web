import { prisma } from "@/lib/prisma";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "expired" | "refunded";

export interface BookingRecord {
  id: string;
  fieldId: string;
  customer: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  createdAt: string;
}

interface CreateBookingInput {
  fieldId: string;
  customerId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
}

interface BookingResult {
  success: boolean;
  message: string;
  booking?: BookingRecord;
  statusCode: number;
}

const holidayDates = ["2026-07-17", "2026-12-25"];
const maintenanceSchedules = [
  {
    fieldId: "field-1",
    startAt: "2026-07-07T10:00:00.000Z",
    endAt: "2026-07-07T11:00:00.000Z",
  },
];

function getDateKey(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isHoliday(date: Date, timezone: string) {
  const key = getDateKey(date, timezone);
  return holidayDates.includes(key);
}

function isMaintenanceConflict(fieldId: string, startAt: Date, endAt: Date) {
  return maintenanceSchedules.some((schedule) => {
    if (schedule.fieldId !== fieldId) return false;
    const scheduleStart = new Date(schedule.startAt);
    const scheduleEnd = new Date(schedule.endAt);
    return startAt < scheduleEnd && endAt > scheduleStart;
  });
}

async function purgeExpiredReservations(now: Date = new Date()) {
  const expirationCutoff = new Date(now.getTime() - 15 * 60 * 1000);
  await prisma.booking.updateMany({
    where: {
      status: "pending",
      createdAt: { lt: expirationCutoff },
    },
    data: { status: "expired" },
  });
}

async function hasOverlap(fieldId: string, startAt: Date, endAt: Date) {
  const overlapping = await prisma.booking.findFirst({
    where: {
      fieldId,
      status: {
        notIn: ["cancelled", "expired"],
      },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  return overlapping !== null;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const timezone = input.timezone ?? "UTC";

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return {
      success: false,
      message: "Invalid booking time range.",
      statusCode: 400,
    };
  }

  if (endAt <= startAt) {
    return {
      success: false,
      message: "Booking end time must be after start time.",
      statusCode: 400,
    };
  }

  if (isHoliday(startAt, timezone)) {
    return {
      success: false,
      message: "The selected date is not available because it is marked as a holiday.",
      statusCode: 409,
    };
  }

  if (isMaintenanceConflict(input.fieldId, startAt, endAt)) {
    return {
      success: false,
      message: "The selected slot overlaps a maintenance window.",
      statusCode: 409,
    };
  }

  await purgeExpiredReservations(new Date());

  if (await hasOverlap(input.fieldId, startAt, endAt)) {
    return {
      success: false,
      message: "The selected slot is no longer available.",
      statusCode: 409,
    };
  }

  const now = new Date();
  const record = await prisma.booking.create({
    data: {
      customer: input.customerId || "anonymous",
      fieldId: input.fieldId,
      startAt,
      endAt,
      status: "pending",
      createdAt: now,
    },
  });

  return {
    success: true,
    message: "Booking reserved successfully.",
    booking: {
      id: record.id,
      fieldId: record.fieldId,
      customer: record.customer,
      startAt: record.startAt.toISOString(),
      endAt: record.endAt.toISOString(),
      status: record.status as BookingStatus,
      createdAt: record.createdAt.toISOString(),
    },
    statusCode: 201,
  };
}
