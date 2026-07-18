"use client";

import { useEffect, useState } from "react";
import { AnimatedCard } from "@/components/animated-card";
import { formatCurrency } from "@/utils/formatting";

type BookingHistoryItem = {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  field: {
    name: string;
  };
  payments?: Array<{
    status: string;
    transactionId?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatBookingDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getBadgeClasses(status: string) {
  switch (status) {
    case "confirmed":
    case "success":
      return "bg-emerald-500/10 text-emerald-200";
    case "pending":
      return "bg-amber-500/10 text-amber-200";
    case "cancelled":
    case "expired":
    case "refunded":
      return "bg-rose-500/10 text-rose-200";
    default:
      return "bg-[color:rgba(16,185,129,0.12)] text-[color:var(--accent)]";
  }
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bookings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load booking history.");
        }
        return data.bookings as BookingHistoryItem[];
      })
      .then((data) => setBookings(data))
      .catch((error) => setError((error as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 bg-[color:var(--background)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking history</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Your complete booking timeline</h1>
            </div>
            <button className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">Export</button>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">Loading booking history…</div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-500/10 bg-rose-500/5 p-6 text-sm text-rose-200">{error}</div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">No bookings found. Start by choosing a field and date on the booking page.</div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-[640px] w-full table-auto text-left text-sm text-[color:var(--muted)]">
                    <thead className="bg-[color:rgba(0,0,0,0.28)] text-[color:var(--muted)]">
                      <tr>
                        <th className="px-4 py-3">Booking ID</th>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((item) => (
                        <tr key={item.id} className="border-t border-white/10 bg-[color:rgba(15,23,42,0.08)]">
                          <td className="px-4 py-3 text-[color:var(--foreground)]">{item.id}</td>
                          <td className="px-4 py-3">{item.field.name}</td>
                          <td className="px-4 py-3">{formatBookingDate(item.bookingDate)}</td>
                          <td className="px-4 py-3">{formatCurrency(item.totalPrice)}</td>
                          <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.status)}`}>{item.status}</span></td>
                          <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.payments?.[0]?.status ?? "pending")}`}>{item.payments?.[0]?.status ?? "pending"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {bookings.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 card-surface p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Booking ID</p>
                          <p className="font-semibold text-white">{item.id}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.status)}`}>{item.status}</span>
                          <span className={`rounded-full px-3 py-1 text-sm ${getBadgeClasses(item.payments?.[0]?.status ?? "pending")}`}>{item.payments?.[0]?.status ?? "pending"}</span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[color:var(--muted)]">
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Field</p>
                          <p className="text-sm text-white">{item.field.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[color:var(--muted)]">Date</p>
                          <p className="text-sm text-white">{formatBookingDate(item.bookingDate)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-[color:var(--muted)]">Amount</p>
                          <p className="text-sm text-white">{formatCurrency(item.totalPrice)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-[color:var(--muted)]">Payment</p>
                          <p className="text-sm text-white">{item.payments?.[0]?.status ?? "pending"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
