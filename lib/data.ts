import type { Field } from "@/types";
import { prisma } from "@/lib/prisma";
import { BLOCKING_BOOKING_STATUSES } from "@/lib/booking-engine";
import { DEFAULT_FIELD_NAME, DEFAULT_FIELD } from "@/lib/venue";
import { getFieldHourlyRate } from "@/lib/site-content";
import { facilityImages, getFallbackReviews } from "@/lib/mock-data";
import type { FacilityImage, VenueGalleryImage } from "@/types";

export async function getFields(): Promise<Field[]> {
  const hourlyRate = await getFieldHourlyRate();
  return [{ ...DEFAULT_FIELD, price: hourlyRate }];
}

export async function getVenueFeatures(): Promise<FacilityImage[]> {
  try {
    const records = await prisma.venueFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const activeRecords: Array<{
      id: string;
      name: string;
      description: string;
      imageUrl: string;
      isActive: boolean;
      sortOrder: number;
    }> = records.filter(
      (feature: { imageUrl?: string | null }) => {
        const value = typeof feature.imageUrl === "string" ? feature.imageUrl.trim().replace(/[\r\n\t]+/g, "") : "";
        return value.length > 0;
      },
    );

    if (activeRecords.length > 0) {
      return activeRecords.map((feature) => ({
        id: feature.id,
        title: feature.name,
        description: feature.description,
        imageUrl: feature.imageUrl.trim().replace(/[\r\n\t]+/g, ""),
        isActive: feature.isActive,
        sortOrder: feature.sortOrder,
      }));
    }

    return facilityImages;
  } catch (error) {
    console.error("[DATA] Unable to load venue features:", error);
    return facilityImages;
  }
}

export async function getVenueGallery(): Promise<VenueGalleryImage[]> {
  const fallback = facilityImages.map((image, index) => ({
    id: image.id ?? `fallback-gallery-${index}`,
    title: image.title,
    imageUrl: image.imageUrl,
    sortOrder: index,
    isActive: true,
  }));
  try {
    const records = await prisma.venueGallery.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    const activeRecords: Array<{ id: string; title: string; imageUrl: string; sortOrder: number; isActive: boolean }> = records.filter(
      (image: { imageUrl?: string | null }) => {
        const value = typeof image.imageUrl === "string" ? image.imageUrl.trim().replace(/[\r\n\t]+/g, "") : "";
        return value.length > 0;
      },
    );
    return activeRecords.length > 0 ? activeRecords.map((image) => ({ ...image, imageUrl: image.imageUrl.trim().replace(/[\r\n\t]+/g, "") })) : fallback;
  } catch (error) {
    console.error("[DATA] Unable to load venue gallery:", error);
    return fallback;
  }
}

export async function getUpcomingBookings(limit = 5) {
  return prisma.booking.findMany({
    where: {
      status: {
        in: BLOCKING_BOOKING_STATUSES,
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
  try {
    const records = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return records.map((r: { id: string; customerName: string; rating: number | string; comment: string; createdAt: Date }) => ({
      id: r.id,
      customerName: r.customerName,
      rating: Number(r.rating),
      comment: r.comment,
      date: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[DATA] Unable to load reviews from database:", error);
    return getFallbackReviews();
  }
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
