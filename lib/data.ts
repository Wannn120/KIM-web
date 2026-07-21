import type { Field } from "@/types";
import { prisma } from "@/lib/prisma";

export async function getFields(): Promise<Field[]> {
  const fields = await prisma.field.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return fields.map((field) => ({
    id: field.id,
    name: field.name,
    location: field.location,
    price: Number(field.price),
    type: field.type,
    size: field.size,
    rating: Number(field.rating),
    imageUrl: field.imageUrl ?? undefined,
  }));
}

export async function getUpcomingBookings(limit = 5) {
  return prisma.booking.findMany({
    where: {
      status: {
        notIn: ["cancelled", "expired"],
      },
      bookingDate: {
        gte: new Date(),
      },
    },
    include: {
      field: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { bookingDate: "asc" },
      { startTime: "asc" },
    ],
    take: limit,
  });
}

export async function getReviews(): Promise<import("@/types").Review[]> {
  const records = await prisma.review.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      field: {
        select: {
          name: true,
        },
      },
    },
  });

  return records.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: Number(r.rating),
    comment: r.comment,
    date: r.createdAt.toISOString(),
  }));
}

export type BookedSlot = {
  date: string;
  time: string;
  field: string;
  status: string;
};

export function mapBookingsToSlots(bookings: Array<{ bookingDate: Date; startTime: string; endTime: string; fieldId: string; field?: { name?: string } | null; status: string }>): BookedSlot[] {
  return bookings.map((booking) => ({
    date: booking.bookingDate.toISOString().slice(0, 10),
    time: `${booking.startTime} - ${booking.endTime}`,
    field: booking.field?.name ?? booking.fieldId,
    status: booking.status === "pending" ? "Booked" : booking.status,
  }));
}
