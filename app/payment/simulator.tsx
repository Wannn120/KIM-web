"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const paymentOptions = [
  "QRIS",
  "GoPay",
  "Dana",
  "ShopeePay",
  "OVO",
  "BCA",
  "BNI",
  "Mandiri",
] as const;

type PaymentMethod = (typeof paymentOptions)[number];

type PaymentStatus = "pending" | "success" | "failed" | "expired" | "cancelled";

type PaymentRecord = {
  id?: string;
  bookingId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  amount?: number;
  provider?: string;
  expiredAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  paidAt?: string | Date | null;
  booking?: {
    id?: string;
    fieldId?: string;
  } | null;
};

const fakeQrCode = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MINISOCCER-DEMO";

function buildAccountNumber(method: PaymentMethod) {
  const prefix = method === "BCA" ? "8888" : method === "BNI" ? "9999" : "7777";
  return `${prefix}${Math.floor(100000000000 + Math.random() * 900000000000)}`;
}

export function PaymentSimulator({ bookingId, amount, fieldName, bookingDate, bookingTime, customerName }: {
  bookingId: string;
  amount: number;
  fieldName: string;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [processing, setProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accountNumber = useMemo(() => buildAccountNumber(paymentMethod), [paymentMethod]);

  const createTransaction = async (method: PaymentMethod) => {
    const payload = {
      bookingId,
      amount,
      paymentMethod: method,
      customerName,
      email: "demo@minisoccer.id",
      phone: "+628123456789",
    };

    const response = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || "Unable to create payment transaction.");
    }

    const data = await response.json();
    if (!data?.success || !data?.transaction?.transactionId) {
      throw new Error(data?.message || "Payment transaction could not be created.");
    }

    return data.transaction;
  };

  const loadPayment = async (transactionId: string) => {
    const response = await fetch(`/api/payments/transaction?transactionId=${encodeURIComponent(transactionId)}`);
    if (!response.ok) {
      throw new Error("Unable to load payment details.");
    }

    const data = await response.json();
    if (!data?.success || !data?.payment) {
      throw new Error(data?.message || "Payment details not found.");
    }

    return data.payment;
  };

  const refreshPaymentRecord = async (transactionId: string) => {
    const payment = await loadPayment(transactionId);
    setPaymentRecord(payment);
    setStatus(payment.status as PaymentStatus);
  };

  const visibleStatus = paymentRecord?.status ?? status;
  const visibleMethod = paymentRecord?.paymentMethod ?? paymentMethod;
  const visibleTransactionId = paymentRecord?.transactionId ?? transactionId;
  const visibleAmount = paymentRecord?.amount ?? amount;
  const visibleProvider = paymentRecord?.provider ?? "DemoPaymentProvider";
  const visibleExpiredAt = paymentRecord?.expiredAt
    ? new Date(paymentRecord.expiredAt as string | Date).toLocaleString("en-GB")
    : new Date(Date.now() + 15 * 60 * 1000).toLocaleString("en-GB");
  const visibleCreatedAt = paymentRecord?.createdAt ? new Date(paymentRecord.createdAt as string | Date).toLocaleString("en-GB") : "—";
  const visibleUpdatedAt = paymentRecord?.updatedAt ? new Date(paymentRecord.updatedAt as string | Date).toLocaleString("en-GB") : "—";
  const visiblePaidAt = paymentRecord?.paidAt ? new Date(paymentRecord.paidAt as string | Date).toLocaleString("en-GB") : "—";

  const statusClassName = visibleStatus === "pending"
    ? "bg-yellow-500/10 text-yellow-300"
    : visibleStatus === "success"
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-rose-500/10 text-rose-300";

  const settleTransaction = async (transactionId: string, nextStatus: PaymentStatus) => {
    await fetch("/api/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, status: nextStatus }),
    });
  };

  const startDemoPayment = async () => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      let currentTransactionId = transactionId;

      if (!currentTransactionId) {
        const transaction = await createTransaction(paymentMethod);
        currentTransactionId = transaction.transactionId;
        setTransactionId(currentTransactionId);
      }

      if (currentTransactionId) {
        await refreshPaymentRecord(currentTransactionId);
      }

      setStatus("pending");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const settlePendingTransaction = async (nextStatus: PaymentStatus) => {
    if (!transactionId) {
      setErrorMessage("Create a transaction before settling it.");
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      await settleTransaction(transactionId, nextStatus);
      await refreshPaymentRecord(transactionId);

      if (nextStatus === "success") {
        router.push(`/payment/success?transactionId=${encodeURIComponent(transactionId)}`);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const methodType = paymentMethod === "QRIS" ? "QRIS" : ["BCA", "BNI", "Mandiri"].includes(paymentMethod) ? "Virtual Account" : "E-Wallet";

  return (
    <div className="space-y-8 p-8 rounded-[2rem] border border-white/10 bg-[color:var(--surface)] shadow-lg">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Demo payment gateway</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Complete your demo payment</h1>
          <p className="mt-4 text-[color:var(--muted)]">This is a local demo payment flow for now. It is not a real Midtrans integration yet.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-[color:var(--background-strong)] p-6">
          <div className="grid gap-3 text-sm text-[color:var(--muted)]">
            <div className="flex justify-between"><span>Booking ID</span><span className="text-white">{bookingId}</span></div>
            <div className="flex justify-between"><span>Field</span><span className="text-white">{fieldName}</span></div>
            <div className="flex justify-between"><span>Date</span><span className="text-white">{bookingDate}</span></div>
            <div className="flex justify-between"><span>Time</span><span className="text-white">{bookingTime}</span></div>
            <div className="flex justify-between"><span>Customer</span><span className="text-white">{customerName}</span></div>
            <div className="flex justify-between"><span>Total</span><span className="text-white">Rp {amount.toLocaleString("id-ID")}</span></div>
            <div className="flex justify-between"><span>Status</span><span className={`rounded-full px-3 py-1 text-sm ${statusClassName}`}>{visibleStatus}</span></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-[color:var(--background-strong)] p-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentOptions.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${paymentMethod === method ? "border-[color:rgba(16,185,129,0.3)] bg-[color:rgba(16,185,129,0.08)]" : "border-white/10 bg-transparent"}`}>
                  <p className="font-semibold text-white">{method}</p>
                  <p className="mt-1 text-[color:var(--muted)]">{method === "QRIS" ? "Scan the demo QR code." : methodType === "Virtual Account" ? "Use a virtual account number." : "Simulate a wallet payment."}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-[color:var(--surface-strong)] p-6">
            <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
              <span>Method</span>
              <span>{methodType}</span>
            </div>
            {paymentMethod === "QRIS" ? (
              <div className="space-y-4 text-center">
                <img src={fakeQrCode} alt="Fake QR code" className="mx-auto h-48 w-48 rounded-3xl border border-white/10 bg-white/5" />
                <p className="text-sm text-[color:var(--muted)]">Use the QR code to simulate a payment on any wallet app.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-[#0f172a] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{paymentMethod}</p>
                    <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">{methodType}</span>
                  </div>
                  {methodType === "Virtual Account" ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">Virtual account number</p>
                      <p className="text-lg font-semibold text-white">{accountNumber}</p>
                      <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-[color:var(--accent)]">Copy Number</button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-[color:var(--muted)]">Wallet account</p>
                      <p className="text-lg font-semibold text-white">{customerName}</p>
                      <p className="text-sm text-[color:var(--muted)]">Use any fake wallet account details to simulate payment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={startDemoPayment}
              disabled={processing}
              className="btn-primary w-full py-4 text-lg">
              {processing ? "Creating transaction…" : visibleStatus === "pending" ? "Create / Refresh Payment" : "Start Demo Payment"}
            </button>

            {visibleStatus === "pending" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => settlePendingTransaction("success")}
                  disabled={processing}
                  className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                >
                  {processing ? "Processing…" : "Selesai / Bayar"}
                </button>
                <button
                  onClick={() => settlePendingTransaction("cancelled")}
                  disabled={processing}
                  className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  {processing ? "Processing…" : "Batal"}
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </section>

        <aside className="space-y-6 rounded-3xl border border-white/10 bg-[color:var(--surface-strong)] p-8">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Timer</p>
            <span className="text-sm text-[color:var(--muted)]">15:00 remaining</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-3/4 bg-[color:var(--accent)]"></div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white">Persisted payment record</h3>
            <div className="grid gap-3 text-sm text-[color:var(--muted)]">
              <div className="flex justify-between"><span>DB transaction</span><span className="text-right text-white">{visibleTransactionId || "TBD"}</span></div>
              <div className="flex justify-between"><span>Status</span><span className={`rounded-full px-3 py-1 text-sm ${statusClassName}`}>{visibleStatus}</span></div>
              <div className="flex justify-between"><span>Method</span><span className="text-white">{visibleMethod}</span></div>
              <div className="flex justify-between"><span>Amount</span><span className="text-white">Rp {visibleAmount.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span>Provider</span><span className="text-white">{visibleProvider}</span></div>
              <div className="flex justify-between"><span>Booking</span><span className="text-white">{paymentRecord?.booking?.id ?? bookingId}</span></div>
              <div className="flex justify-between"><span>Created</span><span className="text-white">{visibleCreatedAt}</span></div>
              <div className="flex justify-between"><span>Updated</span><span className="text-white">{visibleUpdatedAt}</span></div>
              <div className="flex justify-between"><span>Paid at</span><span className="text-white">{visiblePaidAt}</span></div>
              <div className="flex justify-between"><span>Expires</span><span className="text-white">{visibleExpiredAt}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
