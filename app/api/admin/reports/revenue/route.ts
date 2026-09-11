import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

interface RevenueBucket {
  label: string;
  revenue: number;
  bookings: number;
  payments: number;
}

export async function GET(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin || !hasAdminPermission(admin, "canViewReports")) {
    return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") ?? "daily";
  const startParam = url.searchParams.get("startDate");
  const endParam = url.searchParams.get("endDate");

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (startParam && endParam) {
    startDate = new Date(startParam);
    endDate = new Date(endParam);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "daily") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 83);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: "success",
        paidAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, paidAt: true },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["confirmed", "completed", "pending"] },
      },
      select: { createdAt: true },
    });

    const bucketMap = new Map<string, RevenueBucket>();

    function getBucketKey(date: Date): string {
      if (period === "daily") {
        return date.toISOString().split("T")[0];
      }
      if (period === "weekly") {
        const d = new Date(date);
        const dayOfWeek = d.getUTCDay();
        d.setUTCDate(d.getUTCDate() - dayOfWeek);
        const weekStart = d.toISOString().split("T")[0];
        return `Minggu ${weekStart}`;
      }
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    }

    function getBucketLabel(key: string): string {
      if (period === "daily") {
        const d = new Date(key);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      }
      if (period === "weekly") {
        const datePart = key.replace("Minggu ", "");
        const d = new Date(datePart);
        return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`;
      }
      const [year, month] = key.split("-");
      const d = new Date(Number(year), Number(month) - 1);
      return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    }

    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = getBucketKey(p.paidAt);
      const existing = bucketMap.get(key);
      if (existing) {
        existing.revenue += p.amount;
      } else {
        bucketMap.set(key, { label: key, revenue: p.amount, bookings: 0, payments: 0 });
      }
    }

    for (const b of bookings) {
      const key = getBucketKey(b.createdAt);
      const existing = bucketMap.get(key);
      if (existing) {
        existing.bookings += 1;
      } else {
        bucketMap.set(key, { label: key, revenue: 0, bookings: 1, payments: 0 });
      }
    }

    for (const p of payments) {
      if (!p.paidAt) continue;
      const key = getBucketKey(p.paidAt);
      const existing = bucketMap.get(key);
      if (existing) {
        existing.payments += 1;
      }
    }

    const buckets = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, bucket]) => ({ ...bucket, label: getBucketLabel(bucket.label) }));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBookings = bookings.length;
    const totalPayments = payments.length;
    const avgPerBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

    return NextResponse.json({
      success: true,
      data: { buckets, totalRevenue, totalBookings, totalPayments, avgPerBooking },
    });
  } catch (error) {
    console.error("[REPORTS] Revenue report error:", error);
    return NextResponse.json({ success: false, message: "Unable to generate revenue report." }, { status: 500 });
  }
}
