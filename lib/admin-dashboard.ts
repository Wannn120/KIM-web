import { prisma } from "@/lib/prisma";

export interface AdminSummary {
  revenueToday: number;
  revenueThisMonth: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  peakHours: Array<{ hour: string; bookings: number }>;
  mostBookedField: { name: string; bookings: number } | null;
  customerStats: { totalCustomers: number; activeCustomers: number; newCustomersThisMonth: number };
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // Revenue: sum of successful payments paid today and this month
  const revenueTodayResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "success", paidAt: { gte: startOfToday, lt: startOfTomorrow } },
  });

  const revenueMonthResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "success", paidAt: { gte: startOfMonth, lt: startOfTomorrow } },
  });

  const bookingsToday = await prisma.booking.count({ where: { bookingDate: { gte: startOfToday, lt: startOfTomorrow } } });
  const bookingsThisMonth = await prisma.booking.count({ where: { bookingDate: { gte: startOfMonth, lt: startOfTomorrow } } });

  // Peak hours (group by startTime)
  const peakRows = await prisma.booking.groupBy({
    by: ["startTime"],
    _count: { startTime: true },
    where: { bookingDate: { gte: startOfMonth, lt: startOfTomorrow } },
    orderBy: { _count: { startTime: "desc" } },
    take: 5,
  });

  const peakHours = peakRows.map((r) => ({ hour: r.startTime, bookings: r._count.startTime }));

  // Most booked field
  const fieldRows = await prisma.booking.groupBy({
    by: ["fieldId"],
    _count: { fieldId: true },
    where: { bookingDate: { gte: startOfMonth, lt: startOfTomorrow } },
    orderBy: { _count: { fieldId: "desc" } },
    take: 1,
  });

  let mostBookedField = null;
  if (fieldRows.length > 0) {
    const field = await prisma.field.findUnique({ where: { id: fieldRows[0].fieldId } });
    mostBookedField = { name: field?.name ?? "Unknown", bookings: fieldRows[0]._count.fieldId };
  }

  const totalCustomers = await prisma.customer.count();
  const activeCustomers = await prisma.customer.count({ where: { status: "ACTIVE" } });
  const newCustomersThisMonth = await prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } });

  return {
    revenueToday: revenueTodayResult._sum.amount ?? 0,
    revenueThisMonth: revenueMonthResult._sum.amount ?? 0,
    bookingsToday,
    bookingsThisMonth,
    peakHours,
    mostBookedField,
    customerStats: { totalCustomers, activeCustomers, newCustomersThisMonth },
  };
}
