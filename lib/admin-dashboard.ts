import { prisma } from "@/lib/prisma";

export interface AdminSummary {
  revenueToday: number;
  revenueThisMonth: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  pendingBookings: number;
  pendingPayments: number;
  peakHours: Array<{ hour: string; bookings: number }>;
  mostBookedField: { name: string; bookings: number } | null;
  customerStats: { totalCustomers: number; activeCustomers: number; newCustomersThisMonth: number };
}

export function getDefaultAdminSummary(): AdminSummary {
  return {
    revenueToday: 0,
    revenueThisMonth: 0,
    bookingsToday: 0,
    bookingsThisMonth: 0,
    pendingBookings: 0,
    pendingPayments: 0,
    peakHours: [],
    mostBookedField: null,
    customerStats: { totalCustomers: 0, activeCustomers: 0, newCustomersThisMonth: 0 },
  };
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMessage = (error as { message?: unknown }).message;

  return maybeCode === "P2021" || (typeof maybeMessage === "string" && maybeMessage.includes("does not exist"));
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const fallback = getDefaultAdminSummary();

  try {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    let revenueToday = 0;
    let revenueThisMonth = 0;
    let bookingsToday = 0;
    let bookingsThisMonth = 0;
    let peakHours: Array<{ hour: string; bookings: number }> = [];
    let mostBookedField: { name: string; bookings: number } | null = null;
    let pendingBookings = 0;
    let pendingPayments = 0;
    let totalCustomers = 0;
    let activeCustomers = 0;
    let newCustomersThisMonth = 0;

    try {
      const revenueTodayResult = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "success", paidAt: { gte: startOfToday, lt: endOfToday } },
      });
      revenueToday = Number(revenueTodayResult._sum.amount ?? 0);
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load today's revenue summary:", error);
      }
    }

    try {
      const revenueMonthResult = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "success", paidAt: { gte: startOfMonth, lt: endOfMonth } },
      });
      revenueThisMonth = Number(revenueMonthResult._sum.amount ?? 0);
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load monthly revenue summary:", error);
      }
    }

    try {
      pendingBookings = await prisma.booking.count({
        where: { status: "pending" },
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load pending bookings summary:", error);
      }
    }

    try {
      pendingPayments = await prisma.payment.count({
        where: { status: "pending" },
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load pending payments summary:", error);
      }
    }

    try {
      bookingsToday = await prisma.booking.count({
        where: {
          bookingDate: { gte: startOfToday, lt: endOfToday },
          status: { in: ["confirmed", "completed"] },
        },
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load today's booking count:", error);
      }
    }

    try {
      bookingsThisMonth = await prisma.booking.count({
        where: {
          bookingDate: { gte: startOfMonth, lt: endOfMonth },
          status: { in: ["confirmed", "completed"] },
        },
      });
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load monthly booking count:", error);
      }
    }

    try {
      const peakRows = await prisma.booking.groupBy({
        by: ["startTime"],
        _count: { startTime: true },
        where: {
          bookingDate: { gte: startOfMonth, lt: endOfMonth },
          status: { in: ["confirmed", "completed"] },
        },
        orderBy: { _count: { startTime: "desc" } },
        take: 5,
      });
      peakHours = peakRows.map((r) => ({ hour: r.startTime, bookings: r._count.startTime }));
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load peak hours summary:", error);
      }
    }

    try {
      const fieldRows = await prisma.booking.groupBy({
        by: ["fieldId"],
        _count: { fieldId: true },
        where: {
          bookingDate: { gte: startOfMonth, lt: endOfMonth },
          status: { in: ["confirmed", "completed"] },
        },
        orderBy: { _count: { fieldId: "desc" } },
        take: 1,
      });

      if (fieldRows.length > 0) {
        const field = await prisma.field.findUnique({ where: { id: fieldRows[0].fieldId } });
        mostBookedField = { name: field?.name ?? "Unknown", bookings: fieldRows[0]._count.fieldId };
      }
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load most-booked-field summary:", error);
      }
    }

    try {
      totalCustomers = await prisma.customer.count();
      activeCustomers = await prisma.customer.count({ where: { status: "ACTIVE" } });
      newCustomersThisMonth = await prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } });
    } catch (error) {
      if (!isMissingTableError(error)) {
        console.error("[ADMIN] Unable to load customer stats summary:", error);
      }
    }

    return {
      revenueToday,
      revenueThisMonth,
      bookingsToday,
      bookingsThisMonth,
      pendingBookings,
      pendingPayments,
      peakHours,
      mostBookedField,
      customerStats: { totalCustomers, activeCustomers, newCustomersThisMonth },
    };
  } catch (error) {
    console.error("[ADMIN] Unable to load dashboard summary:", error);
    return fallback;
  }
}
