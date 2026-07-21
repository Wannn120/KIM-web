import { prisma } from "@/lib/prisma";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "expired" | "refunded";

export interface BookingRecord {
  id: string;
  fieldId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

interface CreateBookingInput {
  fieldId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
    bookingDate: "2026-07-07",
    startTime: "10:00",
    endTime: "11:00",
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

function isMaintenanceConflict(fieldId: string, bookingDate: string, startTime: string, endTime: string) {
  return maintenanceSchedules.some((schedule) => {
    if (schedule.fieldId !== fieldId || schedule.bookingDate !== bookingDate) return false;
    return startTime < schedule.endTime && endTime > schedule.startTime;
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

async function hasOverlap(fieldId: string, bookingDate: string, startTime: string, endTime: string) {
  const overlapping = await prisma.booking.findFirst({
    where: {
      fieldId,
      bookingDate: new Date(bookingDate),
      status: {
        notIn: ["cancelled", "expired"],
      },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  return overlapping !== null;
}

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const bookingDate = new Date(input.bookingDate);
  const startTime = input.startTime;
  const endTime = input.endTime;
  const timezone = input.timezone ?? "UTC";

  if (!input.customerName || !input.customerPhone) {
    return {
      success: false,
      message: "Customer name and phone number are required.",
      statusCode: 400,
    };
  }

  if (Number.isNaN(bookingDate.getTime())) {
    return {
      success: false,
      message: "Invalid booking date.",
      statusCode: 400,
    };
  }

  if (endTime <= startTime) {
    return {
      success: false,
      message: "Booking end time must be after start time.",
      statusCode: 400,
    };
  }

  if (isHoliday(bookingDate, timezone)) {
    return {
      success: false,
      message: "The selected date is not available because it is marked as a holiday.",
      statusCode: 409,
    };
  }

  if (isMaintenanceConflict(input.fieldId, input.bookingDate, startTime, endTime)) {
    return {
      success: false,
      message: "The selected slot overlaps a maintenance window.",
      statusCode: 409,
    };
  }

  await purgeExpiredReservations(new Date());

  if (await hasOverlap(input.fieldId, input.bookingDate, startTime, endTime)) {
    return {
      success: false,
      message: "The selected slot is no longer available.",
      statusCode: 409,
    };
  }

  const durationHours = Number(endTime.split(":")[0]) - Number(startTime.split(":")[0]);
  const totalPrice = input.pricePerHour * Math.max(durationHours, 1);

  const record = await prisma.booking.create({
    data: {
      fieldId: input.fieldId,
      bookingDate,
      startTime,
      endTime,
      durationHours: Math.max(durationHours, 1),
      totalPrice,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      status: "pending",
    },
  });

  return {
    success: true,
    message: "Booking reserved successfully.",
    booking: {
      id: record.id,
      fieldId: record.fieldId,
      bookingDate: record.bookingDate.toISOString(),
      startTime: record.startTime,
      endTime: record.endTime,
      status: record.status as BookingStatus,
      createdAt: record.createdAt.toISOString(),
    },
    statusCode: 201,
  };
}
