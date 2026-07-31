import type { Field } from "@/types";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FIELD_NAME, DEFAULT_FIELD } from "@/lib/venue";
import { facilityImages } from "@/lib/mock-data";
import type { FacilityImage } from "@/types";

export async function getFields(): Promise<Field[]> {
  return [DEFAULT_FIELD];
}

export async function getVenueFeatures(): Promise<FacilityImage[]> {
  try {
    const records = await prisma.venueFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return records.length > 0
      ? records.map((feature) => ({
          id: feature.id,
          title: feature.name,
          description: feature.description,
          imageUrl: feature.imageUrl,
          isActive: feature.isActive,
          sortOrder: feature.sortOrder,
        }))
      : facilityImages;
  } catch (error) {
    console.error("[DATA] Unable to load venue features:", error);
    return facilityImages;
  }
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

export function mapBookingsToSlots(bookings: Array<{ bookingDate: Date; startTime: string; endTime: string; status: string }>): BookedSlot[] {
  return bookings.map((booking) => ({
    date: booking.bookingDate.toISOString().slice(0, 10),
    time: `${booking.startTime} - ${booking.endTime}`,
    field: DEFAULT_FIELD_NAME,
    status: booking.status === "pending" ? "Booked" : booking.status,
  }));
}
