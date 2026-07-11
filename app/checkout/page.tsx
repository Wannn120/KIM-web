"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";

const bookingDetails = {
  fieldId: "field-1",
  fieldName: "Elite Turf 1",
  customerName: "Demo Customer",
  startAt: "2026-07-07T19:00:00.000Z",
  endAt: "2026-07-07T20:00:00.000Z",
  timezone: "Asia/Jakarta",
  amount: 170000,
};

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeRange(start: string, end: string) {
  const startTime = new Date(start).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(end).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startTime} - ${endTime}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: bookingDetails.fieldId,
          customerId: "demo-user",
          startAt: bookingDetails.startAt,
          endAt: bookingDetails.endAt,
          timezone: bookingDetails.timezone,
          customerName: bookingDetails.customerName,
          email: "demo@minisoccer.id",
          phone: "+628123456789",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success || !result.booking?.id) {
        throw new Error(result.message || "Unable to create booking.");
      }

      const bookingDate = formatDate(result.booking.startAt);
      const bookingTime = formatTimeRange(result.booking.startAt, result.booking.endAt);
      const query = new URLSearchParams({
        bookingId: result.booking.id,
        amount: bookingDetails.amount.toString(),
        fieldName: bookingDetails.fieldName,
        bookingDate,
        bookingTime,
        customerName: bookingDetails.customerName,
      }).toString();

      router.push(`/payment?${query}`);
    } catch (error) {
      setError((error as Error).message);
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="card-surface p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Secure checkout</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review your booking details</h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
            Confirm the field, date, and time before moving to the payment gateway.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Field</p>
              <p className="mt-2 text-xl font-semibold text-white">{bookingDetails.fieldName}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Indoor • 5v5</p>
            </div>
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Date</p>
              <p className="mt-2 text-xl font-semibold text-white">{formatDate(bookingDetails.startAt)}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{formatTimeRange(bookingDetails.startAt, bookingDetails.endAt)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Total</p>
              <p className="mt-2 text-3xl font-semibold text-white">Rp {bookingDetails.amount.toLocaleString("id-ID")}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Per hour booking</p>
            </div>
          </div>
        </div>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Payment summary</h2>
          <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
            <div className="flex justify-between"><span>Base price</span><span>Rp 180.000</span></div>
            <div className="flex justify-between"><span>Service fee</span><span>Rp 10.000</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- Rp 20.000</span></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>Rp 170.000</span></div>
          </div>

          {error ? (
            <p className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            onClick={handleCheckout}
            disabled={saving}
            className="mt-8 btn-primary w-full py-4 text-lg"
          >
            {saving ? "Reserving booking…" : "Confirm and pay"}
          </button>
        </AnimatedCard>
      </div>
    </main>
  );
}
