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
      startAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    take: limit,
  });
}

export async function getReviews(): Promise<import("@/types").Review[]> {
  const records = await prisma.review.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: Number(r.rating),
    comment: r.comment,
    date: r.date ?? r.createdAt.toISOString().slice(0, 10),
  }));
}

export type BookedSlot = {
  date: string;
  time: string;
  field: string;
  status: string;
};

export function mapBookingsToSlots(bookings: Array<{ startAt: Date; endAt: Date; fieldId: string; status: string }>): BookedSlot[] {
  return bookings.map((booking) => ({
    date: booking.startAt.toISOString().slice(0, 10),
    time: `${booking.startAt.toISOString().slice(11, 16)} - ${booking.endAt.toISOString().slice(11, 16)}`,
    field: booking.fieldId,
    status: booking.status === "pending" ? "Booked" : booking.status,
  }));
}
