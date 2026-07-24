"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";
import { getMidtransConfig } from "@/lib/midtrans";

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

interface MidtransSnapWindow {
  Snap?: {
    pay?: (token: string, callbacks: {
      onSuccess?: () => void;
      onPending?: () => void;
      onError?: () => void;
      onClose?: () => void;
    }) => void;
    embed?: (token: string, container: string, callbacks: {
      onSuccess?: () => void;
      onPending?: () => void;
      onError?: () => void;
      onClose?: () => void;
    }) => void;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [snapReady, setSnapReady] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [embedCheckoutLoaded, setEmbedCheckoutLoaded] = useState(false);
  const [snapLoadError, setSnapLoadError] = useState<string | null>(null);

  const { snapScriptUrl, clientKey: snapClientKey } = useMemo(() => getMidtransConfig(), []);

  const fieldId = getSearchParam(searchParams.get("fieldId"));
  const fieldName = getSearchParam(searchParams.get("fieldName"));
  const bookingDate = getSearchParam(searchParams.get("bookingDate"));
  const startTime = getSearchParam(searchParams.get("startTime"));
  const endTime = getSearchParam(searchParams.get("endTime"));
  const amount = Number(getSearchParam(searchParams.get("amount"), "0"));

  const hasValidBookingDetails = Boolean(fieldId && fieldName && bookingDate && startTime && endTime && amount > 0);
  const hasValidCustomerInfo = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());

  useEffect(() => {
    const onSnapReady = () => {
      const win = window as unknown as MidtransSnapWindow;
      setSnapReady(Boolean(win.Snap));
    };

    if (typeof window !== "undefined") {
      onSnapReady();
      window.addEventListener("snap:ready", onSnapReady);
      return () => window.removeEventListener("snap:ready", onSnapReady);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !snapToken || embedCheckoutLoaded) {
      return;
    }

    const win = window as unknown as MidtransSnapWindow;
    const snap = win.Snap;
    if (!snap) {
      if (snapReady) {
        setSnapLoadError("Payment gateway failed to initialize. Please refresh the page or try again.");
      }
      return;
    }

    const callbacks = {
      onSuccess: () => {
        if (currentTransactionId) {
          router.push(`/payment/success?transactionId=${encodeURIComponent(currentTransactionId)}`);
        }
      },
      onPending: () => {
        if (currentTransactionId) {
          router.push(`/payment/success?transactionId=${encodeURIComponent(currentTransactionId)}`);
        }
      },
      onError: () => {
        if (currentTransactionId) {
          router.push(`/payment/failure?transactionId=${encodeURIComponent(currentTransactionId)}`);
        }
      },
      onClose: () => {
        router.push("/booking-history");
      },
    };

    try {
      if (typeof snap.embed === "function") {
        snap.embed(snapToken, "#snap-container", callbacks);
        setEmbedCheckoutLoaded(true);
        setSaving(false);
        setSnapLoadError(null);
        return;
      }

      if (typeof snap.pay === "function") {
        snap.pay(snapToken, callbacks);
        setEmbedCheckoutLoaded(true);
        setSaving(false);
        setSnapLoadError(null);
        return;
      }

      setSnapLoadError("This payment method is not available right now. Please refresh or try again later.");
    } catch {
      setSnapLoadError("Unable to load the payment checkout. Please refresh the page and try again.");
    }
  }, [snapToken, snapReady, embedCheckoutLoaded, currentTransactionId, router]);

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

      // Payment created successfully, use Snap embedded checkout when available.
      if (paymentResult.snapToken) {
        setSnapToken(paymentResult.snapToken);
        setSnapUrl(paymentResult.snapUrl ?? null);
        setCurrentTransactionId(result.booking.id);
        return;
      }

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
      <Script src={snapScriptUrl} data-client-key={snapClientKey} strategy="afterInteractive" />
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
            disabled={saving || !hasValidBookingDetails || !hasValidCustomerInfo || !snapReady}
            className="mt-8 btn-primary w-full py-4 text-lg disabled:opacity-60"
          >
            {saving ? "Processing…" : snapReady ? "Confirm and pay" : "Loading payment gateway…"}
          </button>

          {snapToken ? (
            <div className="mt-10 rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
              <h2 className="text-xl font-semibold text-white">Inline payment checkout</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Complete the payment in the embedded checkout below. The page remains on your site.
              </p>

              {snapLoadError ? (
                <div className="mt-6 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
                  <p>{snapLoadError}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Reload page
                    </button>
                    {snapUrl ? (
                      <a
                        href={snapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Continue via payment link
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-white/10 bg-black/10 p-6">
                  {!embedCheckoutLoaded ? (
                    <div className="flex min-h-[300px] items-center justify-center rounded-3xl bg-[color:var(--background)] p-8 text-center text-sm text-[color:var(--muted)]">
                      <div>
                        <p className="font-medium text-white">Loading payment checkout…</p>
                        <p className="mt-2">Please wait while Midtrans initializes the embedded payment experience.</p>
                      </div>
                    </div>
                  ) : null}
                  <div id="snap-container" className="mt-6 min-h-[400px]" />
                </div>
              )}
            </div>
          ) : null}
        </AnimatedCard>
      </div>
    </main>
  );
}
