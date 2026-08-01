"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/utils/formatting";

declare global {
  interface Window {
    snap?: {
      embed: (token: string, container: string) => void;
    };
  }
}

type PaymentRecord = {
  status: string;
  snapToken?: string | null;
  snapUrl?: string | null;
};

type BookingPaymentEmbedProps = {
  bookingId: string;
  amount: number;
  fieldName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  initialPayment?: PaymentRecord | null;
};

const statusBadge = {
  success: "bg-emerald-500/10 text-emerald-200",
  failed: "bg-rose-500/10 text-rose-300",
  cancelled: "bg-rose-500/10 text-rose-300",
  expired: "bg-rose-500/10 text-rose-300",
  pending: "bg-amber-500/10 text-amber-200",
  refunded: "bg-rose-500/10 text-rose-300",
};

const friendlyStatus = {
  success: "Completed",
  pending: "Waiting for confirmation",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  expired: "Payment expired",
  refunded: "Refund processed",
};

function normalizeStatus(status?: string) {
  if (!status) return "pending";
  const normalized = status.toLowerCase();
  if (normalized === "settlement" || normalized === "capture" || normalized === "success") return "success";
  if (normalized === "deny" || normalized === "failure" || normalized === "failed") return "failed";
  if (normalized === "cancel" || normalized === "cancelled") return "cancelled";
  if (normalized === "expire" || normalized === "expired") return "expired";
  if (normalized === "refund" || normalized === "refunded") return "refunded";
  return "pending";
}

export function BookingPaymentEmbed({
  bookingId,
  amount,
  fieldName,
  customerName,
  customerEmail,
  customerPhone,
  initialPayment = null,
}: BookingPaymentEmbedProps) {
  const [config, setConfig] = useState<{ clientKey: string; snapScriptUrl: string; mockMode: boolean } | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(initialPayment);
  const [snapToken, setSnapToken] = useState<string | null>(initialPayment?.snapToken ?? null);
  const [status, setStatus] = useState<string>(normalizeStatus(initialPayment?.status));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const createRequestedRef = useRef(false);

  const isMock = config?.mockMode === true;
  const badgeClass = statusBadge[status as keyof typeof statusBadge] ?? statusBadge.pending;
  const badgeLabel = friendlyStatus[status as keyof typeof friendlyStatus] ?? friendlyStatus.pending;
  const showPaymentInterface = !isMock && config?.clientKey && Boolean(snapToken);

  const fetchConfig = useCallback(async () => {
    const response = await fetch("/api/midtrans/config", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Unable to load payment configuration.");
    }
    setConfig({
      clientKey: data.clientKey ?? "",
      snapScriptUrl: data.snapScriptUrl ?? "",
      mockMode: Boolean(data.mockMode),
    });
  }, []);

  const fetchPayment = useCallback(async () => {
    const response = await fetch(`/api/payments/transaction?transactionId=${encodeURIComponent(bookingId)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to read existing payment status.");
    }

    const data = await response.json();
    if (!data?.success || !data?.payment) {
      throw new Error(data?.message || "Payment information is not available.");
    }

    const paymentRecord: PaymentRecord = {
      status: normalizeStatus(data.payment.status),
      snapToken: data.payment.snapToken ?? null,
      snapUrl: data.payment.snapUrl ?? null,
    };

    setPayment(paymentRecord);
    setSnapToken(paymentRecord.snapToken ?? null);
    setStatus(paymentRecord.status);
  }, [bookingId]);

  const createTransaction = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount,
          paymentMethod: "Midtrans",
          customerName,
          email: customerEmail,
          phone: customerPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to create payment session.");
      }

      const paymentRecord: PaymentRecord = {
        status: normalizeStatus(data.transaction?.status),
        snapToken: data.snapToken ?? null,
        snapUrl: data.snapUrl ?? null,
      };

      setPayment(paymentRecord);
      setSnapToken(paymentRecord.snapToken ?? null);
      setStatus(paymentRecord.status);
      setMessage("Payment session is ready. Complete the payment below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, bookingId, amount, customerEmail, customerName, customerPhone]);

  const refreshPayment = async () => {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      await fetchPayment();
      setMessage("Payment status refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  const simulateMockPayment = async (statusValue: "success" | "failed" | "cancelled" | "expired") => {
    setActionLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: bookingId, status: statusValue }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to simulate payment.");
      }

      await fetchPayment();
      setMessage(`Mock payment updated to: ${statusValue}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setMessage(null);

    Promise.all([fetchConfig(), fetchPayment()])
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingId, fetchConfig, fetchPayment]);

  useEffect(() => {
    if (loading || error || isMock || !config || snapToken || actionLoading) {
      return;
    }
    if (createRequestedRef.current) {
      return;
    }

    createRequestedRef.current = true;
    createTransaction().finally(() => {
      createRequestedRef.current = false;
    });
  }, [loading, error, config, isMock, snapToken, actionLoading, createTransaction]);

  useEffect(() => {
    if (loading || error || isMock || !config?.snapScriptUrl || !snapToken) {
      return;
    }

    const initializeSnap = () => {
      if (!window.snap?.embed) {
        setError("Midtrans Snap is not available in this browser session.");
        setEmbedLoading(false);
        return;
      }

      try {
        window.snap.embed(snapToken, "#snap-container");
        setEmbedLoading(false);
      } catch (_error) {
        setError("Unable to initialize Midtrans payment interface.");
        setEmbedLoading(false);
      }
    };

    if (window.snap?.embed) {
      initializeSnap();
      return;
    }

    const script = document.querySelector(`script[src="${config.snapScriptUrl}"]`) as HTMLScriptElement | null;
    if (script?.getAttribute("data-loaded") === "true") {
      initializeSnap();
      return;
    }

    setEmbedLoading(true);
    const tag = document.createElement("script");
    tag.src = config.snapScriptUrl;
    tag.async = true;
    tag.onload = () => {
      tag.setAttribute("data-loaded", "true");
      initializeSnap();
    };
    tag.onerror = () => {
      setError("Unable to load Midtrans Snap script.");
      setEmbedLoading(false);
    };

    document.body.appendChild(tag);

    return () => {
      if (tag.parentElement) {
        tag.parentElement.removeChild(tag);
      }
    };
  }, [loading, error, isMock, config?.snapScriptUrl, snapToken]);

  const paymentHint = useMemo(() => {
    if (status === "success") return "This booking has already completed payment.";
    if (status === "pending") return "Complete your payment to confirm the reservation.";
    return "Update the payment status to continue.";
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--muted)]">Order total</p>
            <p className="mt-3 text-4xl font-semibold text-white">{formatCurrency(amount)}</p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">{fieldName}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${badgeClass}`}>
            {badgeLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
            <p className="font-medium text-white">Booking ID</p>
            <p className="mt-2 text-sm">{bookingId}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
            <p className="font-medium text-white">Contact</p>
            <p className="mt-2 text-sm">{customerName ?? "Guest"}</p>
            {customerEmail ? <p className="mt-1 text-sm">{customerEmail}</p> : null}
            {customerPhone ? <p className="mt-1 text-sm">{customerPhone}</p> : null}
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-[color:var(--muted)]">{paymentHint}</p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
        {loading ? (
          <div className="min-h-[280px] flex items-center justify-center text-sm text-[color:var(--muted)]">Loading payment details…</div>
        ) : isMock ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/10 p-6 text-sm text-[color:var(--muted)]">
              <p className="font-semibold text-white">Mock payment mode is active</p>
              <p className="mt-3">No Midtrans credentials are configured. Use the buttons below to simulate a payment lifecycle for this booking.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => simulateMockPayment("success")}
                disabled={actionLoading}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                Simulate success
              </button>
              <button
                type="button"
                onClick={() => simulateMockPayment("failed")}
                disabled={actionLoading}
                className="btn-secondary w-full py-3 disabled:opacity-60"
              >
                Simulate failure
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
              <p className="font-semibold text-white">Current simulation status</p>
              <p className="mt-2">{badgeLabel}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="min-h-[320px] rounded-3xl border border-white/10 bg-black/10 p-4">
              <div id="snap-container" className="min-h-[320px] rounded-3xl bg-[color:var(--background)] p-4" />
              {embedLoading ? (
                <p className="mt-4 text-sm text-[color:var(--muted)]">Initializing payment interface…</p>
              ) : null}
            </div>

            {!showPaymentInterface ? (
              <div className="space-y-4">
                <p className="text-sm text-[color:var(--muted)]">
                  A secure payment session is required before the embedded checkout can appear.
                </p>
                <button
                  type="button"
                  onClick={createTransaction}
                  disabled={actionLoading}
                  className="btn-primary w-full py-3 disabled:opacity-60"
                >
                  {actionLoading ? "Preparing payment…" : "Create payment session"}
                </button>
              </div>
            ) : null}

            {payment?.snapUrl ? (
              <div className="rounded-3xl border border-white/10 bg-black/10 p-4 text-sm text-[color:var(--muted)]">
                <p className="font-semibold text-white">Alternate payment link</p>
                <p className="mt-2">If the embedded checkout does not appear, open the payment flow in a new tab.</p>
                <a
                  href={payment.snapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Open payment in new tab
                </a>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={refreshPayment}
          disabled={actionLoading}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          Refresh payment status
        </button>
        <button
          type="button"
          onClick={createTransaction}
          disabled={actionLoading || isMock}
          className="btn-secondary w-full py-3 disabled:opacity-60"
        >
          Renew payment session
        </button>
      </div>
    </div>
  );
}
