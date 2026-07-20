"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeRange(start: string, end: string) {
  const startTime = new Date(`${start}`).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(`${end}`).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startTime} - ${endTime}`;
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

  const fieldId = getSearchParam(searchParams.get("fieldId"));
  const fieldName = getSearchParam(searchParams.get("fieldName"));
  const bookingDate = getSearchParam(searchParams.get("bookingDate"));
  const startTime = getSearchParam(searchParams.get("startTime"));
  const endTime = getSearchParam(searchParams.get("endTime"));
  const amount = Number(getSearchParam(searchParams.get("amount"), "0"));

  const hasValidBookingDetails = Boolean(fieldId && fieldName && bookingDate && startTime && endTime && amount > 0);
  const hasValidCustomerInfo = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());

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
      // Validate slot again with backend
      try {
        const validateResp = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, bookingDate, startTime, endTime, validateOnly: true }),
        });

        const validateResult = await validateResp.json().catch(() => null);
        if (!validateResp.ok || !validateResult?.success) {
          setError(validateResult?.message || "Slot no longer available.");
          setSaving(false);
          return;
        }
      } catch {
        setError("Unable to validate booking. Please try again.");
        setSaving(false);
        return;
      }

      // Create booking with guest customer info
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId,
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

      // Create payment transaction
      const paymentResp = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: result.booking.id,
          amount,
          paymentMethod: "Midtrans",
          customerName,
          email: customerEmail,
          phone: customerPhone,
        }),
      });

      const paymentResult = await paymentResp.json();
      if (!paymentResp.ok || !paymentResult.success) {
        const bookingTime = `${startTime} - ${endTime}`;
        const query = new URLSearchParams({
          bookingId: result.booking.id,
          amount: amount.toString(),
          fieldName,
          bookingDate: formatDate(bookingDate),
          bookingTime,
          customerName,
          customerEmail,
        }).toString();

        router.push(`/payment?${query}`);
        return;
      }

      // Payment created successfully, redirect to payment page
      if (paymentResult.snapUrl) {
        window.location.href = paymentResult.snapUrl;
      } else {
        router.push("/booking-history");
      }
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
            disabled={saving || !hasValidBookingDetails || !hasValidCustomerInfo}
            className="mt-8 btn-primary w-full py-4 text-lg disabled:opacity-60"
          >
            {saving ? "Processing…" : "Confirm and pay"}
          </button>
        </AnimatedCard>
      </div>
    </main>
  );
    </main>
  );
}
