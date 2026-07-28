"use client";

import { useEffect, useState, useRef } from "react";
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

interface MidtransSnapObject {
  pay?: (token: string, callbacks?: {
    onSuccess?: () => void;
    onPending?: () => void;
    onError?: () => void;
    onClose?: () => void;
  }) => void;
  embed?: (
    token: string,
    target: string | { embedId: string },
    callbacks?: {
      onSuccess?: () => void;
      onPending?: () => void;
      onError?: () => void;
      onClose?: () => void;
    }
  ) => void;
}

interface MidtransSnapWindow {
  Snap?: MidtransSnapObject;
  snap?: MidtransSnapObject;
}

function getSnap(windowObject: MidtransSnapWindow) {
  return windowObject.Snap ?? windowObject.snap;
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
  const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);
  const [snapScriptUrl, setSnapScriptUrl] = useState("");
  const [retryCheckoutCount, setRetryCheckoutCount] = useState(0);
  const [snapClientKey, setSnapClientKey] = useState("");
  const [configLoading, setConfigLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const hasSnapClientKey = Boolean(snapClientKey?.trim());
  const isPaymentConfigured = !configLoading && hasSnapClientKey && Boolean(snapScriptUrl);

  const fieldId = getSearchParam(searchParams.get("fieldId"));
  const fieldName = getSearchParam(searchParams.get("fieldName"));
  const bookingDate = getSearchParam(searchParams.get("bookingDate"));
  const startTime = getSearchParam(searchParams.get("startTime"));
  const endTime = getSearchParam(searchParams.get("endTime"));
  const amount = Number(getSearchParam(searchParams.get("amount"), "0"));

  const hasValidBookingDetails = Boolean(fieldId && fieldName && bookingDate && startTime && endTime && amount > 0);
  const hasValidCustomerInfo = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());
  const canSubmit = hasValidBookingDetails && isPaymentConfigured;

  useEffect(() => {
    if (fieldId && !isUuid(fieldId) && !fieldName) {
      setError("Booking details are invalid. Please return to the booking page and select a valid slot.");
    }
  }, [fieldId, fieldName]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadConfig() {
      setConfigLoading(true);
      setScriptLoadError(null);

      try {
        const response = await fetch("/api/midtrans/config", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Unable to load payment gateway configuration.");
        }

        setSnapClientKey(data.clientKey ?? "");
        setSnapScriptUrl(data.snapScriptUrl ?? "");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setScriptLoadError(
          error instanceof Error ? error.message : String(error) || "Unable to load payment gateway configuration."
        );
      } finally {
        setConfigLoading(false);
      }
    }

    loadConfig();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onSnapReady = () => {
      const win = window as unknown as MidtransSnapWindow;
      setSnapReady(Boolean(getSnap(win)));
    };

    if (typeof window !== "undefined") {
      onSnapReady();
      const interval = window.setInterval(onSnapReady, 300);
      window.addEventListener("snap:ready", onSnapReady);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("snap:ready", onSnapReady);
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (configLoading) {
      return;
    }

    if (!hasSnapClientKey) {
      setScriptLoadError("Payment gateway is not configured. Please contact support.");
      return;
    }

    if (!snapScriptUrl) {
      setScriptLoadError("Payment gateway script URL is not configured. Please contact support.");
      return;
    }

    const existing = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    let checkInterval: number | null = null;

    const markReady = () => {
      const win = window as unknown as MidtransSnapWindow;
      const foundSnap = getSnap(win);
      if (foundSnap) {
        setSnapReady(true);
        setScriptLoadError(null);
        if (checkInterval !== null) {
          window.clearInterval(checkInterval);
          checkInterval = null;
        }
      }
    };

    const shouldReloadScript = retryCheckoutCount > 0 && existing !== null && !getSnap(window as unknown as MidtransSnapWindow);
    if (existing && !shouldReloadScript) {
      if (getSnap(window as unknown as MidtransSnapWindow)) {
        setSnapReady(true);
      } else {
        checkInterval = window.setInterval(markReady, 250);
      }
      return () => {
        if (checkInterval !== null) {
          window.clearInterval(checkInterval);
        }
      };
    }

    if (existing) {
      existing.remove();
      setSnapReady(false);
      setEmbedCheckoutLoaded(false);
      setSnapLoadError(null);
      setIsRetrying(true);
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = snapScriptUrl;
    script.async = true;
    script.setAttribute("data-client-key", snapClientKey);
    script.onload = () => {
      markReady();
    };
    script.onerror = () => {
      setScriptLoadError("Unable to load payment gateway. Please refresh and try again.");
      if (checkInterval !== null) {
        window.clearInterval(checkInterval);
        checkInterval = null;
      }
    };

    document.body.appendChild(script);
    checkInterval = window.setInterval(markReady, 250);

    return () => {
      if (checkInterval !== null) {
        window.clearInterval(checkInterval);
      }
      script.onload = null;
      script.onerror = null;
    };
  }, [configLoading, hasSnapClientKey, snapScriptUrl, snapClientKey, retryCheckoutCount]);

  useEffect(() => {
    if (typeof window === "undefined" || !snapToken) {
      return;
    }

    const win = window as unknown as MidtransSnapWindow;
    const snap = getSnap(win);
    if (!snap) {
      if (snapReady) {
        setSnapLoadError("Payment gateway failed to initialize. Please refresh or use the payment link.");
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
        setSnapLoadError("Payment checkout was closed. Please retry or use the payment link.");
      },
    };

    const container = document.querySelector("#snap-container");

    try {
        const containerEl = document.querySelector("#snap-container") as HTMLElement | null;
        if (containerEl) {
          try {
            containerEl.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch {}
        }

      if (typeof snap.embed === "function" && container) {
        try {
          snap.embed(snapToken, { embedId: "#snap-container" }, callbacks);
          setEmbedCheckoutLoaded(true);
          setSnapLoadError(null);
        } catch (error) {
          console.error("Midtrans embed error:", error);
          if (typeof snap.pay === "function") {
            try {
              snap.pay(snapToken, callbacks);
              setEmbedCheckoutLoaded(true);
              setSnapLoadError(null);
            } catch (payError) {
              console.error("Midtrans pay fallback error:", payError);
              setSnapLoadError(
                "Payment gateway failed to initialize and the fallback payment flow could not start. Please refresh or use the payment link."
              );
            }
          } else {
            setSnapLoadError("Payment gateway failed to initialize. Please refresh or use the payment link.");
          }
        }
        setSaving(false);
        setIsRetrying(false);
        return;
      }

      if (typeof snap.pay === "function") {
        try {
          snap.pay(snapToken, callbacks);
          setEmbedCheckoutLoaded(true);
          setSnapLoadError(null);
        } catch (error) {
          console.error("Midtrans pay error:", error);
          setSnapLoadError("Payment link failed to open. Please refresh or try again later.");
        }
        setSaving(false);
        setIsRetrying(false);
        return;
      }

      setSnapLoadError("This payment method is not available right now. Please refresh or try again later.");
      setSaving(false);
      setIsRetrying(false);
    } catch (error) {
      console.error("Midtrans checkout error:", error);
      setSnapLoadError("Unable to load the payment checkout. Please refresh the page and try again.");
      setSaving(false);
      setIsRetrying(false);
    }
  }, [snapToken, snapReady, embedCheckoutLoaded, currentTransactionId, retryCheckoutCount, router]);

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
    setSnapLoadError(null);
    setRetryCheckoutCount(0);
    setIsRetrying(false);

    try {
      // Validate slot again with backend
      try {
        const validateResp = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, fieldName, bookingDate, startTime, endTime, validateOnly: true }),
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

      if (!isPaymentConfigured) {
        throw new Error("Payment gateway is not configured. Please contact support.");
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
        return;
      }

      router.push("/booking-history");
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
            {saving
              ? "Processing…"
              : scriptLoadError
              ? "Cannot load payment gateway"
              : canSubmit
              ? "Confirm and pay"
              : configLoading
              ? "Loading payment gateway…"
              : "Enter booking information to continue"}
          </button>
          {scriptLoadError ? (
            <p className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {scriptLoadError}
            </p>
          ) : null}

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
                      onClick={() => {
                        setSnapLoadError(null);
                        setEmbedCheckoutLoaded(false);
                        setRetryCheckoutCount((count) => count + 1);
                      }}
                      disabled={saving || isRetrying}
                      className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isRetrying ? "Retrying…" : "Retry checkout"}
                    </button>
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
