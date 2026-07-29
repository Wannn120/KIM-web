"use client";

import { useEffect, useState } from "react";

interface StaffBookingItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  field: {
    id: string;
    name: string;
    location: string;
  };
}

export default function StaffBookingViewer({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [bookings, setBookings] = useState<StaffBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/bookings", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load bookings");
        setBookings(data.data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const content = (
    <div className="mx-auto max-w-7xl space-y-8" id="staff-bookings">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff booking viewer</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Booking history</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only booking details for staff operations.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <section className="rounded-[1.5rem] border border-white/10 bg-[color:var(--surface)] p-6">
          <h2 className="text-2xl font-semibold text-white">Bookings</h2>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Field</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3 text-white">{booking.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{booking.field.name}</td>
                    <td className="px-4 py-3">{booking.customerName}</td>
                    <td className="px-4 py-3">{booking.bookingDate.split("T")[0]} {booking.startTime}–{booking.endTime}</td>
                    <td className="px-4 py-3">Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                  </tr>
                ))}
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                      {loading ? "Loading bookings..." : "No bookings found."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{content}</main> : content;
}
