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
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  amount?: number;
  provider?: string;
  expiredAt?: string | Date | null;
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
    ? new Date(paymentRecord.expiredAt as string | Date).toLocaleTimeString()
    : new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

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

  const simulate = async () => {
    setProcessing(true);
    setErrorMessage(null);

    try {
      let currentTransactionId = transactionId;

      if (!currentTransactionId) {
        const transaction = await createTransaction(paymentMethod);
        currentTransactionId = transaction.transactionId;
        setTransactionId(currentTransactionId);
        await refreshPaymentRecord(currentTransactionId);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      const outcomes: PaymentStatus[] = ["success", "failed", "expired"];
      const nextStatus = outcomes[Math.floor(Math.random() * outcomes.length)];
      setStatus(nextStatus);

      if (currentTransactionId) {
        await settleTransaction(currentTransactionId, nextStatus);
        await refreshPaymentRecord(currentTransactionId);
      }

      if (nextStatus === "success" && currentTransactionId) {
        router.push(`/payment/success?transactionId=${encodeURIComponent(currentTransactionId)}`);
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

          <button
            onClick={simulate}
            disabled={processing}
            className="btn-primary w-full py-4 text-lg">
            {processing ? "Processing…" : "Simulate Demo Payment"}
          </button>

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
            <h3 className="text-lg font-semibold text-white">Transaction details</h3>
            <div className="grid gap-3 text-sm text-[color:var(--muted)]">
              <div className="flex justify-between"><span>ID</span><span>{visibleTransactionId || "TBD"}</span></div>
              <div className="flex justify-between"><span>Method</span><span>{visibleMethod}</span></div>
              <div className="flex justify-between"><span>Amount</span><span>Rp {visibleAmount.toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span>Provider</span><span>{visibleProvider}</span></div>
              <div className="flex justify-between"><span>Expires</span><span>{visibleExpiredAt}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
