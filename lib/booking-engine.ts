export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

export interface BookingRecord {
  id: string;
  fieldId: string;
  customerId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: BookingStatus;
  createdAt: string;
  expiresAt: string;
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

const bookingStore: BookingRecord[] = [];
const bookingLocks = new Map<string, Promise<void>>();
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

function purgeExpiredReservations(now: Date = new Date()) {
  for (const booking of bookingStore) {
    if (booking.status === "pending" && new Date(booking.expiresAt) <= now) {
      booking.status = "expired";
    }
  }
}

function hasOverlap(fieldId: string, startAt: Date, endAt: Date) {
  purgeExpiredReservations();
  return bookingStore.some((booking) => {
    if (booking.fieldId !== fieldId) return false;
    if (booking.status === "cancelled" || booking.status === "expired") return false;
    const existingStart = new Date(booking.startAt);
    const existingEnd = new Date(booking.endAt);
    return existingStart < endAt && existingEnd > startAt;
  });
}

async function withFieldLock<T>(fieldId: string, operation: () => Promise<T>) {
  const previous = bookingLocks.get(fieldId) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  bookingLocks.set(fieldId, current);

  await previous;
  try {
    return await operation();
  } finally {
    release?.();
    if (bookingLocks.get(fieldId) === current) {
      bookingLocks.delete(fieldId);
    }
  }
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

  return withFieldLock(input.fieldId, async () => {
    const now = new Date();
    purgeExpiredReservations(now);

    if (hasOverlap(input.fieldId, startAt, endAt)) {
      return {
        success: false,
        message: "The selected slot is no longer available.",
        statusCode: 409,
      };
    }

    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const booking: BookingRecord = {
      id: `booking-${Date.now()}`,
      fieldId: input.fieldId,
      customerId: input.customerId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      timezone,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt,
    };

    bookingStore.push(booking);

    return {
      success: true,
      message: "Booking reserved successfully.",
      booking,
      statusCode: 201,
    };
  });
}
