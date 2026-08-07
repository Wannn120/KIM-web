"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";

export const dynamic = "force-dynamic";

function formatTimeRange(start: string, end: string) {
  const parseTime = (value: string) => {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText ?? "0");

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return { hour, minute };
  };

  const formatTime = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const parsedStart = parseTime(start);
  const parsedEnd = parseTime(end);

  if (!parsedStart || !parsedEnd) {
    return `${start} - ${end}`;
  }

  return `${formatTime(parsedStart.hour, parsedStart.minute)} - ${formatTime(parsedEnd.hour, parsedEnd.minute)}`;
}

function getSearchParam(value: string | null, fallback = "") {
  return value ?? fallback;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const fieldName = getSearchParam(searchParams.get("fieldName"), DEFAULT_FIELD_NAME);
  const bookingDate = getSearchParam(searchParams.get("bookingDate"));
  const startTime = getSearchParam(searchParams.get("startTime"));
  const endTime = getSearchParam(searchParams.get("endTime"));
  const amount = Number(getSearchParam(searchParams.get("amount"), "0"));

  const hasValidBookingDetails = Boolean(fieldName && bookingDate && startTime && endTime && amount > 0);
  const hasValidCustomerInfo = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());
  const canSubmit = hasValidBookingDetails;

  const handleCheckout = async () => {
    if (!hasValidBookingDetails) {
      setError("Booking details are incomplete. Please return to the booking page and select a slot.");
      return;
    }

    if (!hasValidCustomerInfo) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const validateResp = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldName, bookingDate, startTime, endTime, validateOnly: true }),
      });

      const validateResult = await validateResp.json().catch(() => null);
      if (!validateResp.ok || !validateResult?.success) {
        setError(validateResult?.message || "Slot no longer available.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldName,
          bookingDate,
          startTime,
          endTime,
          customerName,
          customerEmail,
          customerPhone,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success || !result.booking?.id) {
        throw new Error(result.message || "Unable to create booking.");
      }

      const paymentUrl = `/booking/${encodeURIComponent(result.booking.id)}/payment?autoOpen=1`;
      const popupWindow = window.open("", "_blank", "width=1000,height=900");
      if (popupWindow) {
        popupWindow.location.href = paymentUrl;
      } else {
        router.push(paymentUrl);
      }
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
            Confirm the field, date, and time, then enter your contact information to proceed to payment.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Field</p>
              <p className="mt-2 text-xl font-semibold text-white">{fieldName || "Field not selected"}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Review the selected slot before continuing.</p>
            </div>
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Date</p>
              <p className="mt-2 text-xl font-semibold text-white">{bookingDate || "—"}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{startTime && endTime ? formatTimeRange(startTime, endTime) : "—"}</p>
            </div>
            <div className="rounded-3xl border border-white/10 card-surface p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Total</p>
              <p className="mt-2 text-3xl font-semibold text-white">Rp {amount.toLocaleString("id-ID")}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Estimated charge</p>
            </div>
          </div>
        </div>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Your contact information</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Required for booking confirmation and payment receipt.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onInput={(e) => setCustomerName((e.target as HTMLInputElement).value)}
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                onInput={(e) => setCustomerEmail((e.target as HTMLInputElement).value)}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onInput={(e) => setCustomerPhone((e.target as HTMLInputElement).value)}
                placeholder="Enter your phone number"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-white/10 pt-8 text-sm text-[color:var(--muted)]">
            <div className="flex justify-between"><span>Field booking</span><span>Rp {amount.toLocaleString("id-ID")}</span></div>
          </div>

          {error ? (
            <p className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            onClick={handleCheckout}
            disabled={saving || !canSubmit}
            className="mt-8 btn-primary w-full py-4 text-lg disabled:opacity-60"
          >
            {saving ? "Processing…" : canSubmit ? "Confirm and pay" : "Enter booking information to continue"}
          </button>
        </AnimatedCard>
      </div>
    </main>
  );
}
