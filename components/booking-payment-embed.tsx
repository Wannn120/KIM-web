"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/utils/formatting";

declare global {
  interface Window {
    snap?: {
      pay: (token: string) => void;
      embed?: (token: string, container: string | HTMLElement) => void;
    };
  }
}

type PaymentRecord = {
  status: string;
  snapToken?: string | null;
  snapUrl?: string | null;
};

type PaymentUiState = "idle" | "loading" | "ready" | "active" | "error";

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
  const [, setSnapUrl] = useState<string | null>(initialPayment?.snapUrl ?? null);
  const [status, setStatus] = useState<string>(normalizeStatus(initialPayment?.status));
  const [uiState, setUiState] = useState<PaymentUiState>(initialPayment?.snapToken ? "active" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);
  const createRequestedRef = useRef(false);
  const snapOpenedRef = useRef(false);

  const isMock = config?.mockMode === true;
  const badgeClass = statusBadge[status as keyof typeof statusBadge] ?? statusBadge.pending;
  const badgeLabel = friendlyStatus[status as keyof typeof friendlyStatus] ?? friendlyStatus.pending;

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

  const loadSnapScript = useCallback(async () => {
    if (!config?.snapScriptUrl) {
      setScriptLoadError("Midtrans Snap script URL is not configured.");
      return;
    }

    if (scriptLoaded) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${config.snapScriptUrl}"]`);
      if (existing) {
        setScriptLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = config.snapScriptUrl;
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        setScriptLoadError(null);
        resolve();
      };
      script.onerror = () => {
        const message = "Failed to load Midtrans Snap script.";
        setScriptLoadError(message);
        reject(new Error(message));
      };

      document.body.appendChild(script);
    });
  }, [config?.snapScriptUrl, scriptLoaded]);

  const fetchPayment = useCallback(async () => {
    const response = await fetch(`/api/payments/transaction?bookingId=${encodeURIComponent(bookingId)}`, {
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 404 || data?.error?.includes("Payment record not found")) {
        const emptyPayment: PaymentRecord = { status: "pending", snapToken: null, snapUrl: null };
        setPayment(null);
        setSnapToken(null);
        setSnapUrl(null);
        setStatus("pending");
        setUiState("ready");
        return emptyPayment;
      }
      throw new Error(data?.message || "Unable to read existing payment status.");
    }

    if (!data?.success || !data?.payment) {
      const emptyPayment: PaymentRecord = { status: "pending", snapToken: null, snapUrl: null };
      setPayment(null);
      setSnapToken(null);
      setSnapUrl(null);
      setStatus("pending");
      setUiState("ready");
      return emptyPayment;
    }

    const paymentRecord: PaymentRecord = {
      status: normalizeStatus(data.payment.status),
      snapToken: data.payment.snapToken ?? null,
      snapUrl: data.payment.snapUrl ?? null,
    };

    setPayment(paymentRecord);
    setSnapToken(paymentRecord.snapToken ?? null);
    setSnapUrl(paymentRecord.snapUrl ?? null);
    setStatus(paymentRecord.status);
    setUiState(paymentRecord.snapToken ? "active" : "ready");
    return paymentRecord;
  }, [bookingId]);

  const createTransaction = useCallback(async (options?: { forceNew?: boolean }) => {
    if (actionLoading) return;
    setActionLoading(true);
    setUiState("loading");
    setError(null);
    setMessage(null);
    setSnapToken(null);
    setSnapUrl(null);

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
          forceNew: options?.forceNew ?? false,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || data?.message || "Unable to create payment session.");
      }

      const paymentRecord: PaymentRecord = {
        status: normalizeStatus(data.transaction?.status),
        snapToken: data.snapToken ?? null,
        snapUrl: data.snapUrl ?? null,
      };

      setPayment(paymentRecord);
      setSnapToken(paymentRecord.snapToken ?? null);
      setSnapUrl(paymentRecord.snapUrl ?? null);
      setStatus(paymentRecord.status);
      setUiState(paymentRecord.snapToken ? "active" : "ready");
      setMessage("Payment session is ready. Complete the payment below.");
    } catch (err) {
      setUiState("error");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, bookingId, amount, customerEmail, customerName, customerPhone]);

  const openSnap = useCallback(async (token: string) => {
    if (!token.trim()) {
      setError("Invalid Snap token.");
      return;
    }

    try {
      await loadSnapScript();
      if (!window.snap?.pay) {
        throw new Error("Midtrans Snap script did not expose the expected API.");
      }

      snapOpenedRef.current = true;
      window.snap.pay(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setUiState("ready");
    }
  }, [loadSnapScript]);

  const refreshPayment = useCallback(async () => {
    setActionLoading(true);
    setUiState("loading");
    setError(null);
    setMessage(null);
    setSnapToken(null);
    setSnapUrl(null);

    try {
      const paymentRecord = await fetchPayment();
      setUiState(paymentRecord.snapToken ? "active" : "ready");
      setMessage("Payment status refreshed.");
    } catch (err) {
      setUiState("error");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  }, [fetchPayment]);

  const simulateMockPayment = async (statusValue: "success" | "failed" | "cancelled" | "expired") => {
    setActionLoading(true);
    setUiState("loading");
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

      const paymentRecord = await fetchPayment();
      setUiState(paymentRecord.snapToken ? "active" : "ready");
      setMessage(`Mock payment updated to: ${statusValue}.`);
    } catch (err) {
      setUiState("error");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setUiState("loading");
    setError(null);
    setMessage(null);

    Promise.all([fetchConfig(), fetchPayment()])
      .then((results) => {
        if (!active) return;
        
        // Check if payment was already processed before component loaded
        const paymentRecord = results[1];
        if (paymentRecord?.status === "success") {
          // Redirect immediately if payment already completed
          window.location.href = `/payment/success?transactionId=${encodeURIComponent(bookingId)}`;
        } else if (["failed", "cancelled", "expired"].includes(paymentRecord?.status ?? "")) {
          // Show error if payment already failed
          setError(`Payment ${paymentRecord?.status}. Please try again.`);
          setUiState("ready");
        }
      })
      .catch((err) => {
        if (!active) return;
        setUiState("error");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
  }, [bookingId, fetchConfig, fetchPayment]);

  useEffect(() => {
    if (uiState !== "ready" || isMock || !config || actionLoading || createRequestedRef.current) {
      return;
    }

    createRequestedRef.current = true;
    createTransaction({ forceNew: false }).finally(() => {
      createRequestedRef.current = false;
    });
  }, [uiState, config, isMock, actionLoading, createTransaction]);

  useEffect(() => {
    if (uiState === "loading" || uiState === "error" || isMock || !snapToken || !snapToken.trim()) {
      return;
    }

    if (!snapOpenedRef.current) {
      openSnap(snapToken).finally(() => {
        snapOpenedRef.current = false;
      });
    }
  }, [uiState, isMock, openSnap, snapToken]);

  // Poll for payment status updates
  useEffect(() => {
    if (status !== "pending" || isMock) {
      return;
    }

    let active = true;
    let intervalId: NodeJS.Timeout | null = null;

    const pollPaymentStatus = async () => {
      try {
        const paymentRecord = await fetchPayment();
        if (!active) return;

        // If payment status changed
        if (paymentRecord.status !== status) {
          if (paymentRecord.status === "success") {
            // Redirect to success page
            window.location.href = `/payment/success?transactionId=${encodeURIComponent(bookingId)}`;
          } else if (["failed", "cancelled", "expired"].includes(paymentRecord.status)) {
            setError(`Payment ${paymentRecord.status}. Please try again.`);
            setUiState("ready");
          }
        }
      } catch (err) {
        // Silently ignore polling errors
        console.debug("Payment status poll error:", err);
      }
    };

    // Start polling every 3 seconds
    intervalId = setInterval(pollPaymentStatus, 3000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, bookingId, isMock, fetchPayment]);

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
          <p>{error}</p>
          {payment?.snapUrl ? (
            <a
              href={payment.snapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-semibold text-rose-100 hover:bg-rose-500/20"
            >
              Open payment link
            </a>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
        {uiState === "loading" ? (
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
            <div className="rounded-3xl border border-white/10 bg-black/10 p-6 text-sm text-[color:var(--muted)]">
              <p className="font-semibold text-white">Continue to payment</p>
              <p className="mt-2">The embedded checkout is unavailable in this browser session, so the payment will open in a new tab using the secure Midtrans link.</p>
              {payment?.snapUrl ? (
                <a
                  href={payment.snapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Open payment in new tab
                </a>
              ) : null}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-[color:var(--muted)]">
                A secure payment session is required before the checkout can open. If the widget is blocked, use the alternate payment link above.
              </p>
              <button
                type="button"
                onClick={() => createTransaction({ forceNew: true })}
                disabled={actionLoading}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {actionLoading ? "Preparing payment…" : "Create payment session"}
              </button>
            </div>
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
          onClick={() => createTransaction({ forceNew: true })}
          disabled={actionLoading || isMock}
          className="btn-secondary w-full py-3 disabled:opacity-60"
        >
          Renew payment session
        </button>
      </div>
    </div>
  );
}
