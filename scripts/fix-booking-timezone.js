#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const DEFAULT_TIMEZONE = "Asia/Jakarta";
const args = new Set(process.argv.slice(2));
const applyChanges = args.has("--apply");
const dryRun = args.has("--dry-run") || !applyChanges;

function parseTimeString(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const match = normalized.match(/^\d{1,2}:\d{2}$/);
  if (match) {
    const [hourRaw, minuteRaw] = normalized.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return null;
}

function formatDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeBookingDate(dateValue) {
  const date = new Date(dateValue);
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    year: "numeric",
  }).format(date);
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    month: "2-digit",
  }).format(date);
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
  }).format(date);

  const localDateString = `${year}-${month}-${day}T00:00:00+07:00`;
  return new Date(localDateString);
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const bookings = await prisma.booking.findMany({
      select: {
        id: true,
        bookingDate: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const updates = [];

    for (const booking of bookings) {
      const currentBookingDate = new Date(booking.bookingDate);
      const normalizedBookingDate = normalizeBookingDate(currentBookingDate);
      const normalizedStartTime = parseTimeString(booking.startTime);
      const normalizedEndTime = parseTimeString(booking.endTime);

      const dateChanged = formatDateKey(currentBookingDate) !== formatDateKey(normalizedBookingDate);
      const timeChanged = normalizedStartTime !== booking.startTime || normalizedEndTime !== booking.endTime;

      if (dateChanged || timeChanged) {
        updates.push({
          id: booking.id,
          bookingDate: normalizedBookingDate,
          startTime: normalizedStartTime ?? booking.startTime,
          endTime: normalizedEndTime ?? booking.endTime,
          previousDate: booking.bookingDate.toISOString(),
          previousStart: booking.startTime,
          previousEnd: booking.endTime,
        });
      }
    }

    if (dryRun) {
      console.log(`[dry-run] Found ${updates.length} booking records that would be normalized for Asia/Jakarta.`);
      for (const item of updates.slice(0, 10)) {
        console.log(`${item.id}: ${item.previousDate} -> ${item.bookingDate.toISOString()} | ${item.previousStart} -> ${item.startTime} | ${item.previousEnd} -> ${item.endTime}`);
      }
      if (updates.length > 10) {
        console.log(`[dry-run] ... and ${updates.length - 10} more records.`);
      }
      return;
    }

    if (!applyChanges) {
      console.log("No action taken. Pass --apply to update database records.");
      return;
    }

    for (const item of updates) {
      await prisma.booking.update({
        where: { id: item.id },
        data: {
          bookingDate: item.bookingDate,
          startTime: item.startTime,
          endTime: item.endTime,
        },
      });
    }

    console.log(`Updated ${updates.length} booking records to Jakarta timezone values.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Booking timezone normalization failed:", error);
  process.exitCode = 1;
});
